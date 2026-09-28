import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer as createPortServer } from 'node:net'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'refund-clarity-test-'))
const api = `export const adminApi = {
  walletRecovery: async () => {
    window.apiCalls.push('walletRecovery')
    const result = window.responses.shift() ?? { rows: [] }
    if (result.pending) return await new Promise(resolve => { window.resolvePending = resolve })
    if (result.error) throw Error('simulated API failure')
    return result
  },
  retryCredit: async () => { window.financialCalls.push('retryCredit') },
  retryRefund: async () => { window.financialCalls.push('retryRefund') },
  refundDisbursement: async (id, body) => {
    window.disbursementRequests.push({ id, action: body.action })
    return await new Promise(resolve => { window.resolveInquiry = resolve })
  },
}`
const fixture = `
import React from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css'; import '/src/pages/dashboard/AdminPanel.css';
import Actions from '/src/pages/dashboard/RefundDisbursementActions.jsx';
import RecoveryQueue from '/src/pages/dashboard/RecoveryQueue.jsx';
window.apiCalls = []; window.financialCalls = []; window.responses = [];
window.disbursementRequests = [];
const root = createRoot(document.getElementById('app'));
let stage = 'refund actions mount';
const wait = () => new Promise(resolve => setTimeout(resolve, 30));
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await wait() } throw Error('UI timed out during ' + stage) }
async function run() {
  if (location.search.includes('preview')) {
    window.responses.push({ rows: [
      { id: 'preview-ready', reference: 'RF-LONG-READY', amount: 1250000, walletState: 'PAID', creditAttempts: 1,
        tenant: { name: 'Toko dengan nama tenant panjang untuk pemeriksaan tampilan layar kecil', slug: 'tenant-preview-panjang' },
        refund: { id: 'refund-ready', status: 'REFUND_PENDING', retryCount: 0,
          approval: { actorUserId: 'admin-preview', approvedAt: '2026-09-28T08:00:00Z', reason: 'Pemeriksaan rekening penerima' },
          canSendDisbursement: false, canInquireDisbursement: false,
          disbursement: { state: 'READY', accountName: 'Penerima Refund Preview Panjang Sekali', accountLast4: '8900', reference: 'RF-PREVIEW-READY' } } },
      { id: 'preview-failed', reference: 'RF-LONG-FAILED', amount: 980000, walletState: 'PAID', creditAttempts: 2,
        tenant: { name: 'Tenant lain dengan nama yang cukup panjang agar pembungkusan teks dapat dilihat', slug: 'tenant-preview-lain' },
        refund: { id: 'refund-failed', status: 'REFUND_FAILED', retryCount: 1,
          approval: { actorUserId: 'admin-preview', approvedAt: '2026-09-28T07:00:00Z', reason: 'Refund disetujui untuk preview' },
          disbursement: { state: 'FAILED', accountName: 'Nama Pemilik Rekening Preview', accountLast4: '1234', reference: 'RF-PREVIEW-FAILED' } } },
    ] });
    root.render(React.createElement('div', { className: 'adm' },
      React.createElement('button', { className: 'adm-status-action', onClick: () => document.body.classList.toggle('dark') }, 'Ganti tema pratinjau'),
      React.createElement(RecoveryQueue)));
    return;
  }
  root.render(React.createElement(React.Fragment, null,
    React.createElement(Actions, { refund: { id: 'prepare', approval: {}, canPrepareDisbursement: false }, onAction: () => {} }),
    React.createElement(Actions, { refund: { id: 'send', approval: {}, canSendDisbursement: false, disbursement: { state: 'READY' } }, onAction: () => {} }),
    React.createElement(Actions, { refund: { id: 'busy', approval: {}, canPrepareDisbursement: true }, busy: true, onAction: () => {} }),
  ));
  await until(() => document.querySelectorAll('.refund-status button').length === 3);
  const prepare = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Verifikasi rekening'));
  const send = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Kirim refund'));
  const busy = [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-busy') === 'true');
  for (const button of [prepare, send]) {
    if (!button.disabled) throw Error('Server-denied refund action must be disabled');
    const hint = document.getElementById(button.getAttribute('aria-describedby'));
    if (!hint || !hint.textContent.includes('Hubungi admin') || !hint.textContent.includes('server')) throw Error('Disabled action explanation missing');
  }
  if (!busy?.disabled || busy.hasAttribute('aria-describedby')) throw Error('Busy state is not distinct from server denial');

  for (const state of ['SUCCEEDED', 'FAILED']) {
    stage = state + ' terminal render';
    root.render(React.createElement(Actions, { refund: { id: state, approval: {}, canSendDisbursement: true,
      disbursement: { state, dispatchedAt: '2026-09-28', reference: 'RF-TEST' } }, onAction: () => {} }));
    await until(() => document.querySelector('[data-state="' + state + '"]'));
    if (document.querySelector('button')) throw Error('Terminal refund must not offer send or status controls');
  }
  root.render(React.createElement(Actions, { refund: { id: 'REFUNDED', status: 'REFUNDED', approval: {} }, onAction: () => {} }));
  await until(() => document.querySelector('.refund-status-summary')?.textContent === 'Refund berhasil');
  if (document.querySelector('button')) throw Error('Already-refunded payment must not offer verification or transfer controls');

  window.responses.push({ rows: [
    { id: 'current', reference: 'CURRENT', amount: 10000, walletState: 'PAID', creditAttempts: 0,
      refund: { id: 'refund-current', status: 'REFUND_PROCESSING', retryCount: 0, approval: { actorUserId: 'admin', approvedAt: '2026-09-28', reason: 'approved' },
        canInquireDisbursement: true, disbursement: { state: 'UNCERTAIN', dispatchedAt: '2026-09-28', reference: 'RF-CURRENT' } } },
    { id: 'denied-approval', reference: 'APPROVAL-DENIED', amount: 5000, walletState: 'PAID', creditAttempts: 0,
      refund: { id: 'refund-denied', status: 'REFUND_PENDING', retryCount: 0, canApprove: false } },
  ] });
  stage = 'recovery loading';
  root.render(React.createElement('div', { className: 'adm' }, React.createElement(RecoveryQueue)));
  await until(() => document.body.textContent.includes('CURRENT'));
  if (!document.body.textContent.includes('Refund diproses')) throw Error('Localized refund status label changed');
  const approve = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Setujui refund'));
  const approveHint = document.getElementById(approve?.getAttribute('aria-describedby'));
  if (!approve?.disabled || !approveHint?.textContent.includes('Hubungi admin')) throw Error('Disabled approval explanation missing');
  if (!document.querySelector('.adm-recovery-table')) throw Error('Responsive recovery table contract missing');
  if ([...document.querySelectorAll('.adm-recovery-table tbody td')].some(cell => !cell.hasAttribute('data-label'))) throw Error('A recovery cell is missing its mobile label');
  document.querySelector('.refund-status-check button').click();
  await until(() => window.disbursementRequests.length === 1);
  if (window.disbursementRequests[0].action !== 'inquire') throw Error('Status inquiry used a transfer action');
  window.responses.push({ pending: true }, { rows: [{ id: 'current', reference: 'LATEST', amount: 10000, walletState: 'PAID', creditAttempts: 1,
    refund: { id: 'refund-current', status: 'FUTURE_REFUND_STATE', retryCount: 1, approval: { actorUserId: 'admin', approvedAt: '2026-09-28', reason: 'approved' },
      disbursement: { state: 'PENDING', dispatchedAt: '2026-09-28', reference: 'RF-LATEST' } } }] });
  document.querySelector('button.adm-refresh').click();
  stage = 'overlapping refresh response';
  await until(() => document.querySelector('[role="status"]')?.textContent.includes('Memuat'));
  window.resolveInquiry({ state: 'PENDING', dispatchedAt: '2026-09-28', reference: 'RF-CHECKED', accountName: 'Sandbox Dummy', accountLast4: '8900' });
  await until(() => document.body.textContent.includes('LATEST'));
  if (!document.body.textContent.includes('Status belum dikenal') || !document.body.textContent.includes('FUTURE_REFUND_STATE')) throw Error('Unknown refund status lost its neutral label or raw detail');
  window.resolvePending({ rows: [{ id: 'current', reference: 'STALE', amount: 10000, walletState: 'PAID', creditAttempts: 0 }] });
  await wait();
  if (document.body.textContent.includes('STALE') || !document.body.textContent.includes('LATEST')) throw Error('Older refresh overwrote the latest recovery data');

  window.responses.push({ error: true });
  document.querySelector('button.adm-refresh').click();
  stage = 'recovery error response';
  await until(() => document.body.textContent.includes('Antrean pemulihan belum dapat dimuat.'));
  if (document.body.textContent.includes('Tidak ada pembayaran yang memerlukan pemulihan.')) throw Error('Failed load displayed the empty state');
  if (window.financialCalls.length || window.disbursementRequests.some(request => request.action !== 'inquire')) throw Error('UI clarity checks triggered a financial action');
  document.body.dataset.testResult = 'PASS';
}
run().catch(error => { document.body.dataset.testResult = error.message });
`
const portServer = createPortServer()
await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve))
const port = portServer.address().port
await new Promise(resolve => portServer.close(resolve))
const vite = await createServer({ configFile: false, plugins: [react(), {
  name: 'refund-clarity-fixture', enforce: 'pre',
  resolveId(id) { if (id.includes('utils/omniApi')) return '\0refund-api'; if (id === '/refund-clarity-fixture.js') return '\0refund-clarity-fixture' },
  load(id) { if (id === '\0refund-api') return api; if (id === '\0refund-clarity-fixture') return fixture },
  configureServer(server) { server.middlewares.use(async (req, res, next) => {
    if (req.url.split('?')[0] !== '/') return next()
    res.setHeader('Content-Type', 'text/html')
    res.end(await server.transformIndexHtml('/', '<html><body><div id="app"></div><script type="module" src="/refund-clarity-fixture.js"></script></body></html>'))
  }) },
}], server: { host: '127.0.0.1', port, strictPort: true }, logLevel: 'error' })
try {
  await vite.listen()
  if (process.argv.includes('--preview')) {
    console.log(`Preview: http://127.0.0.1:${vite.httpServer.address().port}/?preview=1`)
    await new Promise(resolve => process.once('SIGINT', resolve))
  } else {
  const child = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`])
  let socket
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 10000)
      child.stderr.on('data', chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]) } })
      child.on('error', reject)
    })
    const target = await fetch(`http://${new URL(url).host}/json/new?${encodeURIComponent(`http://127.0.0.1:${vite.httpServer.address().port}/`)}`, { method: 'PUT' }).then(response => response.json())
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject) })
    await new Promise(resolve => setTimeout(resolve, 500))
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('UI test timeout')), 15000)
      socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id === 1) { clearTimeout(timer); resolve(message.result) } })
      socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: `new Promise(resolve => { let checks = 0; const timer = setInterval(() => { if (document.body?.dataset.testResult || ++checks > 400) { clearInterval(timer); resolve(document.body?.dataset.testResult ?? document.documentElement.outerHTML) } }, 30) })`, awaitPromise: true, returnByValue: true } }))
    })
    assert.equal(result?.result?.value, 'PASS', JSON.stringify(result))
    console.log('PASS: refund denial copy, terminal transfer guards, loading/error/stale recovery, mobile labels, unknown states, inquiry-only status check')
  } finally { socket?.close(); child.kill(); await new Promise(resolve => child.once('close', resolve)) }
  }
} finally { await vite.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) }
