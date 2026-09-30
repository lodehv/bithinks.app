import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'admin-accessibility-preview-'))
const api = `
const reads = (name, value) => async () => { window.mockReads.push(name); return value; };
const blocked = (name) => async () => {
  window.mockSideEffects.push(name);
  throw new Error('Local preview blocks all financial actions.');
};
export const adminApi = {
  subscribers: reads('subscribers', {
    summary: { total: 2, active: 1, trial: 1, expired: 0, followUp: 1 },
    rows: [
      { tenantId: 'fixture-alpha', tenantName: 'Demo Alpha Store', ownerName: 'Ari Demo', slug: 'demo-alpha', email: 'alpha@example.test', whatsapp: '628111111111', plan: 'Pro', status: 'active', daysLeft: 28, followUp: true },
      { tenantId: 'fixture-beta', tenantName: 'Demo Beta Shop', ownerName: 'Bela Demo', slug: 'demo-beta', email: 'beta@example.test', whatsapp: '628122222222', plan: 'Starter', status: 'trial', daysLeft: 9, followUp: false },
    ],
  }),
  leads: reads('leads', {
    summary: { total: 1, completed: 1, pending: 0 },
    rows: [{ identifier: 'lead@example.test', channel: 'email', attempts: 1, lastAt: '2026-09-28T00:00:00Z', lastIp: '192.0.2.10', completed: true }],
  }),
  payments: reads('payments', {
    rows: [{ id: 'fixture-payment', reference: 'TEST-PAY-01', amount: '100000', provider: 'Mock', method: 'qris', status: 'pending', tenant: { name: 'Demo Alpha Store' }, createdAt: '2026-09-28T00:00:00Z' }],
  }),
  payment: reads('payment', {
    id: 'fixture-payment', reference: 'TEST-PAY-01', amount: '100000', provider: 'Mock',
    method: 'qris', status: 'pending', walletState: 'PENDING', purpose: 'TOPUP',
    tenant: { name: 'Demo Alpha Store' }, createdAt: '2026-09-28T00:00:00Z',
    refunds: [],
  }),
  wallets: reads('wallets', {
    rows: [{ walletId: 'fixture-wallet', tenant: { id: 'fixture-tenant', name: 'Demo Alpha Store', slug: 'demo-alpha' }, balance: '125', totalTopup: '500', totalUsage: '375', reconciliation: { state: 'reconciled' } }],
  }),
  ledger: reads('ledger', { rows: [] }),
  audits: reads('audits', { rows: [] }),
  walletRecovery: reads('walletRecovery', {
    rows: [{ id: 'fixture-recovery', reference: 'TEST-RECOVERY-01', amount: '100000', walletState: 'CREDITED', creditAttempts: 1, tenant: { name: 'Demo Alpha Store', slug: 'demo-alpha' }, refund: { id: 'fixture-refund', status: 'REFUND_FAILED', retryCount: 1, canApprove: false, canPrepareDisbursement: false, canSendDisbursement: false } }],
  }),
  changeTenantStatus: blocked('changeTenantStatus'),
  reviewPayment: blocked('reviewPayment'),
  retryCredit: blocked('retryCredit'),
  retryRefund: blocked('retryRefund'),
  approveRefund: blocked('approveRefund'),
  refundDisbursement: blocked('refundDisbursement'),
};
`

const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import '/src/index.css';
import '/src/pages/dashboard/DashboardLayout.css';
import AdminPanel from '/src/pages/dashboard/AdminPanel.jsx';
window.mockReads = [];
window.mockSideEffects = [];
if (new URLSearchParams(location.search).get('theme') === 'dark') document.body.classList.add('dark');
function Preview() {
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { padding: '8px 16px', background: '#1f2937', color: '#fff', fontSize: '13px', fontWeight: 700 } }, 'Local mock preview · all financial actions are blocked'),
    React.createElement('main', { className: 'dashboard-content' }, React.createElement(AdminPanel)));
}
createRoot(document.getElementById('app')).render(React.createElement(Preview));
`

const vite = await createServer({
  configFile: false,
  plugins: [react(), {
    name: 'admin-accessibility-preview',
    enforce: 'pre',
    resolveId(id) {
      if (id.includes('utils/omniApi')) return '\0admin-accessibility-api';
      if (id === '/admin-accessibility-fixture.js') return '\0admin-accessibility-fixture';
    },
    load(id) {
      if (id === '\0admin-accessibility-api') return api;
      if (id === '\0admin-accessibility-fixture') return fixture;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.split('?')[0] !== '/') return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await server.transformIndexHtml('/', '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin UI mock preview</title></head><body><div id="app"></div><script type="module" src="/admin-accessibility-fixture.js"></script></body></html>'));
      });
    },
  }],
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserChecks(address) {
  const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const child = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-first-run', '--window-size=375,1000',
    '--remote-debugging-port=0', '--user-data-dir=' + profile,
  ]);
  let socket;
  let nextId = 0;
  const pending = new Map();
  try {
    const debugUrl = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chrome startup timeout')), 10_000);
      child.stderr.on('data', (chunk) => {
        const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      child.on('error', reject);
    });
    const target = await fetch('http://' + new URL(debugUrl).host + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + address.port + '/?test=1'), { method: 'PUT' }).then((response) => response.json());
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve);
      socket.addEventListener('error', reject);
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      }
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? 'Browser evaluation failed');
      return response.result?.value;
    };
    const key = async (name, code, virtualKey) => {
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: virtualKey });
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: virtualKey });
      await delay(60);
    };

    await cdp('Page.enable');
    await cdp('Runtime.enable');
    await cdp('Page.navigate', { url: 'http://127.0.0.1:' + address.port + '/?test=1' });
    let pageReady = false;
    for (let attempt = 0; attempt < 100 && !pageReady; attempt += 1) {
      pageReady = await evaluate('Boolean(document.querySelector("#admin-tab-subscribers") && document.querySelector(".adm-subscriber-table tbody tr"))');
      if (!pageReady) await delay(50);
    }
    assert.ok(pageReady, 'mock AdminPanel did not render');

    await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await delay(80);
    const mobile = await evaluate('(() => { const tabs = document.querySelector(".adm-tabs"); const table = document.querySelector(".adm-subscriber-table"); const wrapper = table.closest(".adm-table-wrap"); return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, tabsScrollable: tabs.scrollWidth > tabs.clientWidth, tabsOverflow: getComputedStyle(tabs).overflowX, tableDisplay: getComputedStyle(table).display, tableMinWidth: getComputedStyle(table).minWidth, wrapperWidth: wrapper.clientWidth, searchLabel: document.querySelector("label[for=adm-subscriber-search]")?.textContent.trim(), headersPresent: [...document.querySelectorAll(".adm-subscriber-table th[scope=col]")].length, touchMinHeight: Math.min(...[...document.querySelectorAll(".adm-tabs [role=tab], .adm-refresh, .adm-filters button, .adm-table .adm-wa, .adm-table .adm-status-action")].map((node) => node.getBoundingClientRect().height)) }; })()');

    await key('Tab', 'Tab', 9);
    await key('Tab', 'Tab', 9);
    const keyboardFocus = await evaluate('(() => { const tab = document.activeElement; return { id: tab.id, outlineStyle: getComputedStyle(tab).outlineStyle, outlineWidth: getComputedStyle(tab).outlineWidth }; })()');
    await key('ArrowRight', 'ArrowRight', 39);
    const arrowRight = await evaluate('({ id: document.activeElement.id, selected: document.activeElement.getAttribute("aria-selected"), panelHidden: document.getElementById(document.activeElement.getAttribute("aria-controls")).hidden })');
    await key('End', 'End', 35);
    const endKey = await evaluate('document.activeElement.id');
    await key('Home', 'Home', 36);
    const homeKey = await evaluate('document.activeElement.id');

    const focusWithin = await evaluate('(() => { const input = document.querySelector("#adm-subscriber-search"); input.focus(); const style = getComputedStyle(input.closest(".adm-search")); return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }; })()');
    const labelAndFilter = await evaluate('(() => { const filter = document.querySelector(".adm-filters button[aria-pressed=true]"); return { searchLabelMatches: document.querySelector("label[for=adm-subscriber-search]")?.htmlFor === document.querySelector("#adm-subscriber-search")?.id, filterPressed: filter?.getAttribute("aria-pressed"), controlsResolve: [...document.querySelectorAll("[role=tab]")].every((button) => document.getElementById(button.getAttribute("aria-controls"))) }; })()');

    await evaluate('(() => { const input = document.querySelector("#adm-subscriber-search"); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; setter.call(input, "no matching fixture"); input.dispatchEvent(new Event("input", { bubbles: true })); })()');
    await delay(80);
    const emptyState = await evaluate('(() => ({ tableDisplay: getComputedStyle(document.querySelector(".adm-subscriber-table")).display, emptyVisible: document.querySelector(".adm-empty")?.textContent.includes("Tidak ada data"), documentWidth: document.documentElement.scrollWidth }))()');

    const viewports = [];
    for (const width of [375, 768, 1024, 1440]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      await delay(80);
      viewports.push(await evaluate('(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, tableDisplay: getComputedStyle(document.querySelector(".adm-subscriber-table")).display, tableWrapScrollWidth: document.querySelector(".adm-table-wrap").scrollWidth }))()'));
    }

    await cdp('Page.navigate', { url: 'http://127.0.0.1:' + address.port + '/?test=1&theme=dark' });
    await delay(250);
    const darkContrast = await evaluate('(() => { const rgb = (value) => value.match(/[\\d.]+/g).slice(0, 3).map(Number); const luminance = (value) => value.map((channel) => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0); const text = luminance(rgb(getComputedStyle(document.querySelector(".adm-head p")).color)); const surface = luminance(rgb(getComputedStyle(document.querySelector(".adm")).backgroundColor)); return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05); })()');
    const sideEffects = await evaluate('window.mockSideEffects.length');

    return { mobile, keyboardFocus, arrowRight, endKey, homeKey, focusWithin, labelAndFilter, emptyState, viewports, darkContrast, sideEffects };
  } finally {
    socket?.close();
    if (child.exitCode === null) {
      child.kill();
      await Promise.race([new Promise((resolve) => child.once('close', resolve)), delay(2000)]);
    }
  }
}

try {
  await vite.listen();
  const address = vite.httpServer.address();
  const lightUrl = 'http://127.0.0.1:' + address.port + '/?preview=1';
  const darkUrl = lightUrl + '&theme=dark';
  if (process.argv.includes('--preview')) {
    console.log('Light preview: ' + lightUrl);
    console.log('Dark preview:  ' + darkUrl);
    console.log('Mock API blocks all financial side effects; press Ctrl+C to stop.');
    await new Promise((resolve) => process.once('SIGINT', resolve));
  } else {
    const result = await runBrowserChecks(address);
    assert.equal(result.mobile.width, 375);
    assert.ok(result.mobile.tabsScrollable, 'tab strip must scroll within its own bounds on mobile');
    assert.equal(result.mobile.tabsOverflow, 'auto');
    assert.equal(result.mobile.tableDisplay, 'block', 'subscriber table must use cards below 768px');
    assert.equal(result.mobile.documentWidth, 375, 'mobile page must not overflow horizontally');
    assert.equal(result.mobile.searchLabel, 'Cari toko, email, atau WhatsApp');
    assert.equal(result.mobile.headersPresent, 8, 'mobile card rows must retain their table headers');
    assert.ok(result.mobile.touchMinHeight >= 44, 'admin controls must meet the 44px touch target');
    assert.equal(result.keyboardFocus.id, 'admin-tab-subscribers');
    assert.equal(result.keyboardFocus.outlineStyle, 'solid', 'keyboard focus ring must be visible');
    assert.equal(Number.parseFloat(result.keyboardFocus.outlineWidth), 3);
    assert.deepEqual(result.arrowRight, { id: 'admin-tab-leads', selected: 'true', panelHidden: false });
    assert.equal(result.endKey, 'admin-tab-audit');
    assert.equal(result.homeKey, 'admin-tab-subscribers');
    assert.equal(result.focusWithin.outlineStyle, 'solid', 'search focus-within ring must be visible');
    assert.equal(Number.parseFloat(result.focusWithin.outlineWidth), 3);
    assert.deepEqual(result.labelAndFilter, { searchLabelMatches: true, filterPressed: 'true', controlsResolve: true });
    assert.deepEqual(result.emptyState, { tableDisplay: 'block', emptyVisible: true, documentWidth: 375 });
    assert.deepEqual(result.viewports.map(({ width }) => width), [375, 768, 1024, 1440]);
    assert.ok(result.viewports.every(({ documentWidth, width }) => documentWidth <= width), 'page width must remain contained at all target viewports');
    assert.ok(result.darkContrast >= 4.5, 'dark theme secondary text must meet 4.5:1 contrast on the admin surface');
    assert.equal(result.sideEffects, 0, 'preview must never call a financial side effect');
    console.log('PASS: mobile cards, contained tab scrolling, 375/768/1024/1440 widths, tab keyboard model, labels, focus rings, contrast, and blocked financial actions');
  }
} finally {
  await vite.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
