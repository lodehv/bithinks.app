import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'admin-ui-regressions-'))
const api = `export const adminApi = {
  wallets: async (args) => {
    window.calls.push(['wallets', args]);
    if (args.tenant && new URLSearchParams(location.search).has('preview')) return { rows: [
      { walletId: 'wallet-a', tenant: { id: 'tenant-a', name: 'Tenant Alpha', slug: 'alpha' }, balance: '123456', totalTopup: '240000', totalUsage: '116544', reconciliation: { state: 'reconciled' } },
      { walletId: 'wallet-b', tenant: { id: 'tenant-b', name: 'Tenant Beta', slug: 'beta' }, balance: '54321', totalTopup: '80000', totalUsage: '25679', reconciliation: { state: 'discrepant' } },
    ] };
    if (args.tenant && window.failNext.wallets) { window.failNext.wallets -= 1; throw Error('wallet request failed'); }
    if (args.tenant) return new Promise((resolve, reject) => { window.pendingWalletLists[args.tenant] = { resolve, reject }; });
    return { rows: [
      { walletId: 'wallet-a', tenant: { id: 'tenant-a', name: 'Tenant Alpha', slug: 'alpha' }, balance: '10', totalTopup: '20', totalUsage: '10', reconciliation: { state: 'reconciled' } },
      { walletId: 'wallet-b', tenant: { id: 'tenant-b', name: 'Tenant Beta', slug: 'beta' }, balance: '30', totalTopup: '40', totalUsage: '10', reconciliation: { state: 'discrepant' } },
    ] };
  },
  ledger: async (args) => {
    window.calls.push(['ledger', args]);
    if (new URLSearchParams(location.search).has('preview')) return { rows: [
      { id: 'entry-preview-1', type: 'ORDER_FEE', amount: '1200', balanceBefore: '124656', balanceAfter: '123456', createdAt: '2026-09-28T00:00:00Z' },
      { id: 'entry-preview-2', type: 'WALLET_TOPUP', amount: '240000', balanceBefore: '0', balanceAfter: '240000', createdAt: '2026-09-27T00:00:00Z' },
    ] };
    return new Promise((resolve, reject) => { window.pendingLedger[args.tenant] = { resolve, reject }; });
  },
  payments: async (args) => {
    window.calls.push(['payments', args]);
    if (new URLSearchParams(location.search).has('preview')) return { rows: [
      { id: 'payment-preview-1', reference: 'PAY-2026-0012', amount: '125000', provider: 'Midtrans', method: 'qris', status: 'approved', tenant: { name: 'Tenant Alpha' }, createdAt: '2026-09-28T00:00:00Z' },
      { id: 'payment-preview-2', reference: 'PAY-2026-0013', amount: '78000', provider: 'Midtrans', method: 'va', status: 'pending', tenant: { name: 'Tenant Beta' }, createdAt: '2026-09-27T00:00:00Z' },
    ] };
    if (args.cursor) return { rows: [{ id: 'payment-next', reference: 'PAY-NEXT', amount: '200', provider: 'test', method: 'qris', status: 'approved', tenant: { name: 'Tenant Beta' }, createdAt: '2026-09-28T00:00:00Z' }], nextCursor: 'cursor-beta-next' };
    if (args.tenant) return new Promise((resolve, reject) => { window.pendingPayments[args.tenant] = { resolve, reject }; });
    return { rows: [{ id: 'payment-initial', reference: 'PAY-INITIAL', amount: '100', provider: 'test', method: 'qris', status: 'pending', tenant: { name: 'Tenant Alpha' }, createdAt: '2026-09-28T00:00:00Z' }], nextCursor: 'cursor-initial' };
  },
  audits: async (args) => {
    window.calls.push(['audits', args]);
    if (window.failNext.audits) { window.failNext.audits -= 1; throw Error('audit request failed'); }
    return { rows: [{ id: 'audit-1', createdAt: '2026-09-28T00:00:00Z', action: 'WALLET_TOPUP_REFUND_APPROVED', entityType: 'REFUND', entityId: 'refund-1', actorUserId: 'admin-test', reason: 'Verified recipient' }] };
  },
}`
const fixture = `
import React from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css'; import '/src/pages/dashboard/AdminPanel.css';
import AdminFinance from '/src/pages/dashboard/AdminFinance.jsx';
window.calls = []; window.pendingLedger = {}; window.pendingPayments = {}; window.pendingWalletLists = {}; window.failNext = { wallets: 0, audits: 0 }; const root = createRoot(document.getElementById('app'));
const wait = () => new Promise(resolve => setTimeout(resolve, 30));
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await wait(); } throw Error('UI timed out'); }
const ledgerButton = (name) => [...document.querySelectorAll('.adm-table tbody tr')].find(row => row.textContent.includes(name))?.querySelector('button');
const setInput = (input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); };
if (new URLSearchParams(location.search).has('preview')) {
  const section = new URLSearchParams(location.search).get('section') || 'wallets';
  root.render(React.createElement(AdminFinance, { section }));
} else {
(async () => {
  root.render(React.createElement(AdminFinance, { section: 'wallets' }));
  await until(() => ledgerButton('Tenant Alpha'));
  const reconciliationLabelsLocalized = document.body.textContent.includes('Sesuai') && document.body.textContent.includes('Selisih')
    && !document.body.textContent.includes('reconciled') && !document.body.textContent.includes('discrepant');
  ledgerButton('Tenant Alpha').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Alpha');
  const loadingVisible = document.body.textContent.includes('Memuat buku besar');
  document.querySelector('.adm-back').click();
  await until(() => ledgerButton('Tenant Beta'));
  ledgerButton('Tenant Beta').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Beta');
  window.pendingLedger['tenant-a'].resolve({ rows: [{ id: 'entry-a', type: 'ORDER_FEE', amount: '777', balanceBefore: '0', balanceAfter: '777', createdAt: '2026-09-28T00:00:00Z' }] });
  await wait();
  const staleEntryRendered = document.querySelector('.adm-detail')?.textContent.includes('777 bit');
  window.pendingLedger['tenant-b'].resolve({ rows: [{ id: 'entry-b', type: 'ORDER_FEE', amount: '888', balanceBefore: '40', balanceAfter: '30', createdAt: '2026-09-28T00:00:00Z' }] });
  await until(() => document.querySelector('.adm-detail')?.textContent.includes('888 bit'));

  document.querySelector('.adm-back').click();
  await until(() => ledgerButton('Tenant Alpha'));
  ledgerButton('Tenant Alpha').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Alpha');
  window.pendingLedger['tenant-a'].resolve({ rows: [{ id: 'entry-a-loaded', type: 'ORDER_FEE', amount: '123', balanceBefore: '0', balanceAfter: '123', createdAt: '2026-09-28T00:00:00Z' }] });
  await until(() => document.querySelector('.adm-detail')?.textContent.includes('123 bit'));
  document.querySelector('.adm-back').click();
  await until(() => ledgerButton('Tenant Beta'));
  ledgerButton('Tenant Beta').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Beta');
  const priorTenantLedgerRendered = document.querySelector('.adm-detail')?.textContent.includes('123 bit');
  window.pendingLedger['tenant-b'].resolve({ rows: [] });
  await until(() => document.querySelector('.adm-detail')?.textContent.includes('Belum ada transaksi'));

  document.querySelector('.adm-back').click();
  await until(() => ledgerButton('Tenant Alpha'));
  ledgerButton('Tenant Alpha').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Alpha');
  const obsoleteAlphaRequest = window.pendingLedger['tenant-a'];
  document.querySelector('.adm-back').click();
  await until(() => ledgerButton('Tenant Beta'));
  ledgerButton('Tenant Beta').click();
  await until(() => document.querySelector('.adm-detail h2')?.textContent === 'Tenant Beta');
  window.pendingLedger['tenant-b'].resolve({ rows: [{ id: 'entry-b-latest', type: 'ORDER_FEE', amount: '456', balanceBefore: '40', balanceAfter: '30', createdAt: '2026-09-28T00:00:00Z' }] });
  await until(() => document.querySelector('.adm-detail')?.textContent.includes('456 bit'));
  obsoleteAlphaRequest.reject(Error('obsolete ledger failure'));
  await wait();
  const staleErrorRendered = document.body.textContent.includes('Buku besar tenant belum dapat dimuat.');
  if (!loadingVisible || staleEntryRendered || priorTenantLedgerRendered || staleErrorRendered) throw Error(JSON.stringify({ loadingVisible, staleEntryRendered, priorTenantLedgerRendered, staleErrorRendered }));

  root.render(React.createElement(AdminFinance, { section: 'payments' }));
  await until(() => window.calls.some(([method]) => method === 'payments'));
  await until(() => document.querySelector('.adm-search input'));
  const paymentSearch = document.querySelector('.adm-search input');
  setInput(paymentSearch, 'a'); await wait();
  setInput(paymentSearch, 'al'); await wait();
  setInput(paymentSearch, 'alpha'); await new Promise(resolve => setTimeout(resolve, 320));
  setInput(paymentSearch, 'beta'); await new Promise(resolve => setTimeout(resolve, 320));
  const searchCalls = window.calls.filter(([method, args]) => method === 'payments' && args.tenant);
  const staleAlphaRequest = window.pendingPayments['alpha'];
  const latestBetaRequest = window.pendingPayments['beta'];
  staleAlphaRequest.reject(Error('obsolete search failure'));
  await wait();
  const staleSearchErrorRendered = document.body.textContent.includes('Riwayat pembayaran belum dapat dimuat.');
  const stillLoadingLatestSearch = document.body.textContent.includes('Memuat data…');
  latestBetaRequest.resolve({ rows: [{ id: 'payment-beta', reference: 'PAY-BETA', amount: '250', provider: 'test', method: 'qris', status: 'approved', tenant: { name: 'Tenant Beta' }, createdAt: '2026-09-28T00:00:00Z' }], nextCursor: 'cursor-beta' });
  await until(() => document.body.textContent.includes('PAY-BETA'));
  const paymentStatusLocalized = document.body.textContent.includes('Disetujui') && !document.body.textContent.includes('approved');
  const staleAlphaRendered = document.body.textContent.includes('PAY-ALPHA');

  setInput(paymentSearch, 'gamma'); await new Promise(resolve => setTimeout(resolve, 320));
  setInput(paymentSearch, 'delta'); await new Promise(resolve => setTimeout(resolve, 320));
  const staleGammaRequest = window.pendingPayments['gamma'];
  window.pendingPayments['delta'].resolve({ rows: [{ id: 'payment-delta', reference: 'PAY-DELTA', amount: '300', provider: 'test', method: 'qris', status: 'approved', tenant: { name: 'Tenant Delta' }, createdAt: '2026-09-28T00:00:00Z' }], nextCursor: 'cursor-delta' });
  await until(() => document.body.textContent.includes('PAY-DELTA'));
  staleGammaRequest.resolve({ rows: [{ id: 'payment-gamma', reference: 'PAY-GAMMA', amount: '350', provider: 'test', method: 'qris', status: 'approved', tenant: { name: 'Tenant Gamma' }, createdAt: '2026-09-28T00:00:00Z' }] });
  await wait();
  const staleGammaRendered = document.body.textContent.includes('PAY-GAMMA');
  if (staleGammaRendered) throw Error(JSON.stringify({ staleGammaRendered }));
  const nextPage = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Muat berikutnya'));
  nextPage?.click();
  await until(() => window.calls.some(([method, args]) => method === 'payments' && args.cursor === 'cursor-delta'));
  await until(() => document.body.textContent.includes('PAY-NEXT'));
  setInput(paymentSearch, 'epsilon');
  await wait();
  const stalePagerVisible = [...document.querySelectorAll('button')].some(button => button.textContent.includes('Muat berikutnya'));
  await new Promise(resolve => setTimeout(resolve, 320));
  const searchCursorSent = window.calls.filter(([method, args]) => method === 'payments' && args.tenant === 'epsilon').some(([, args]) => args.cursor);
  const intermediateSearchCalls = searchCalls.map(([, args]) => args.tenant);
  if (intermediateSearchCalls.join(',') !== 'alpha,beta' || staleSearchErrorRendered || !stillLoadingLatestSearch || staleAlphaRendered || staleGammaRendered || stalePagerVisible || searchCursorSent) {
    throw Error(JSON.stringify({ searchCalls: intermediateSearchCalls, staleSearchErrorRendered, stillLoadingLatestSearch, staleAlphaRendered, staleGammaRendered, stalePagerVisible, searchCursorSent }));
  }

  window.pendingPayments['epsilon']?.resolve({ rows: [] });
  root.render(React.createElement(AdminFinance, { section: 'wallets' }));
  await until(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Buka ledger')));
  const walletSearch = document.querySelector('.adm-search input');
  setInput(walletSearch, 'a'); await wait();
  setInput(walletSearch, 'alpha'); await new Promise(resolve => setTimeout(resolve, 320));
  setInput(walletSearch, 'beta'); await new Promise(resolve => setTimeout(resolve, 320));
  const walletSearchCalls = window.calls.filter(([method, args]) => method === 'wallets' && args.tenant);
  const oldWalletSearch = window.pendingWalletLists['alpha'];
  const latestWalletSearch = window.pendingWalletLists['beta'];
  if (!oldWalletSearch || !latestWalletSearch) throw Error(JSON.stringify({ walletSearchCalls: walletSearchCalls.map(([, args]) => args.tenant), pendingWalletLists: Object.keys(window.pendingWalletLists) }));
  latestWalletSearch.resolve({ rows: [{ walletId: 'wallet-beta', tenant: { id: 'tenant-b', name: 'Tenant Beta', slug: 'beta' }, balance: '40', totalTopup: '50', totalUsage: '10', reconciliation: { state: 'reconciled' } }], nextCursor: 'wallet-beta-next' });
  await until(() => document.body.textContent.includes('Tenant Beta'));
  oldWalletSearch.resolve({ rows: [{ walletId: 'wallet-stale', tenant: { id: 'tenant-a', name: 'STALE ALPHA', slug: 'alpha' }, balance: '999', totalTopup: '999', totalUsage: '0', reconciliation: { state: 'unknown' } }] });
  await wait();
  const staleWalletSearchRendered = document.body.textContent.includes('STALE ALPHA');
  if (walletSearchCalls.map(([, args]) => args.tenant).join(',') !== 'alpha,beta' || staleWalletSearchRendered) {
    throw Error(JSON.stringify({ walletSearchCalls: walletSearchCalls.map(([, args]) => args.tenant), staleWalletSearchRendered }));
  }

  window.failNext.wallets = 1;
  setInput(walletSearch, 'fail-wallet');
  await new Promise(resolve => setTimeout(resolve, 320));
  await until(() => document.body.textContent.includes('Daftar wallet belum dapat dimuat.'));
  const walletErrorHidesEmpty = !document.body.textContent.includes('Tidak ada wallet.');
  [...document.querySelectorAll('button')].find(button => button.textContent.includes('Coba lagi'))?.click();
  await until(() => window.pendingWalletLists['fail-wallet']);
  window.pendingWalletLists['fail-wallet'].resolve({ rows: [{ walletId: 'wallet-retried', tenant: { id: 'tenant-r', name: 'Tenant Retry', slug: 'retry' }, balance: '1', totalTopup: '1', totalUsage: '0', reconciliation: { state: 'unknown' } }] });
  await until(() => document.body.textContent.includes('Tenant Retry'));
  const unknownReconciliationLocalized = document.body.textContent.includes('Belum diketahui') && !document.body.textContent.includes('unknown');

  window.failNext.audits = 1;
  root.render(React.createElement(AdminFinance, { section: 'audit' }));
  await until(() => document.body.textContent.includes('Riwayat audit belum dapat dimuat.'));
  const auditErrorHidesEmpty = !document.body.textContent.includes('Belum ada audit.');
  [...document.querySelectorAll('button')].find(button => button.textContent.includes('Coba lagi'))?.click();
  await until(() => document.body.textContent.includes('WALLET_TOPUP_REFUND_APPROVED'));
  if (!walletErrorHidesEmpty || !auditErrorHidesEmpty || !reconciliationLabelsLocalized || !paymentStatusLocalized || !unknownReconciliationLocalized) {
    throw Error(JSON.stringify({ walletErrorHidesEmpty, auditErrorHidesEmpty, reconciliationLabelsLocalized, paymentStatusLocalized, unknownReconciliationLocalized }));
  }
  document.body.dataset.testResult = 'PASS';
})().catch(error => { document.body.dataset.testResult = error.message; });
}
`
const vite = await createServer({ configFile: false, plugins: [react(), {
  name: 'admin-ui-fixture', enforce: 'pre',
  resolveId(id) { if (id.includes('utils/omniApi')) return '\0admin-api'; if (id === '/admin-fixture.js') return '\0admin-fixture'; },
  load(id) { if (id === '\0admin-api') return api; if (id === '\0admin-fixture') return fixture; },
  configureServer(server) { server.middlewares.use(async (req, res, next) => {
    if (req.url.split('?')[0] !== '/') return next();
    res.setHeader('Content-Type', 'text/html');
    res.end(await server.transformIndexHtml('/', '<html><body><div id="app"></div><script type="module" src="/admin-fixture.js"></script></body></html>'));
  }); },
}], server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
try {
  await vite.listen()
  if (process.argv.includes('--preview')) {
    const base = `http://127.0.0.1:${vite.httpServer.address().port}/?preview=1`;
    console.log(`Admin finance preview: ${base}&section=wallets (also use payments or audit)`);
    await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
  } else {
  const child = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`])
  let socket
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 10000)
      child.stderr.on('data', chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } })
      child.on('error', reject)
    })
    const target = await fetch(`http://${new URL(url).host}/json/new?${encodeURIComponent(`http://127.0.0.1:${vite.httpServer.address().port}/`)}`, { method: 'PUT' }).then(response => response.json())
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); })
    await new Promise(resolve => setTimeout(resolve, 500))
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('UI test timeout')), 12000)
      socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id === 1) { clearTimeout(timer); resolve(message); } })
      socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: `new Promise(resolve => { let checks = 0; const timer = setInterval(() => { if (document.body?.dataset.testResult || ++checks > 300) { clearInterval(timer); resolve(document.body?.dataset.testResult ?? document.documentElement.outerHTML); } }, 30); })`, awaitPromise: true, returnByValue: true } }))
    })
    assert.equal(result.result?.result?.value, 'PASS', JSON.stringify(result))
    console.log('PASS: ledger view follows the selected tenant and exposes loading state')
  } finally { socket?.close(); child.kill(); await new Promise(resolve => child.once('close', resolve)); }
  }
} finally { await vite.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }
