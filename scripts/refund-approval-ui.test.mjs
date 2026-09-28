import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'refund-approval-test-'))
const api = `export const adminApi = { approveRefund: async (...args) => {
  window.approvalCalls.push(args);
  if (window.approvalCalls.length === 1) throw new Error('simulated timeout');
  return { outcome: 'approved' };
} }`
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import '/src/index.css';
import RefundApprovalDialog from '/src/pages/dashboard/RefundApprovalDialog.jsx';
window.approvalCalls = [];
const root = createRoot(document.getElementById('app'));
root.render(React.createElement(RefundApprovalDialog, {
  row: { reference: 'TOPUP-TEST', amount: '10000', refund: { id: 'refund-test' } },
  onClose: () => {}, onApproved: () => { document.body.dataset.approved = 'yes'; }
}));
const wait = () => new Promise((resolve) => setTimeout(resolve, 30));
async function until(check) { for (let i = 0; i < 80; i++) { if (check()) return; await wait(); } throw Error('UI timed out'); }
(async () => {
  await until(() => document.querySelector('dialog[open]'));
  if (location.search.includes('preview')) return;
  const area = document.querySelector('textarea');
  const submit = document.querySelector('[type=submit]');
  const modal = document.querySelector('dialog');
  const rect = modal.getBoundingClientRect();
  if (Math.abs(rect.x + rect.width / 2 - innerWidth / 2) > 2 || Math.abs(rect.y + rect.height / 2 - innerHeight / 2) > 2) throw Error('Dialog is not centered under global reset');
  if (parseFloat(getComputedStyle(modal.querySelector('h2')).fontSize) > 24 || submit.getBoundingClientRect().height < 44) throw Error('Dialog typography/touch target guard missing');
  if (!area.required || !submit.disabled || document.activeElement !== area) throw Error('Reason/focus guard missing');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(area, 'Verified late payment');
  area.dispatchEvent(new Event('input', { bubbles: true }));
  await until(() => !submit.disabled);
  submit.click(); submit.click();
  await until(() => document.querySelector('[role=alert]'));
  if (window.approvalCalls.length !== 1 || !area.disabled) throw Error('Double-click/reason lock guard missing: calls=' + window.approvalCalls.length + ', locked=' + area.disabled);
  submit.click();
  await until(() => document.body.dataset.approved === 'yes');
  if (window.approvalCalls.length !== 2 || JSON.stringify(window.approvalCalls[0]) !== JSON.stringify(window.approvalCalls[1])) throw Error('Retry identity changed');
  if (!document.querySelector('dialog').textContent.includes('belum mentransfer uang')) throw Error('Transfer boundary missing');
  document.body.dataset.testResult = 'PASS';
})().catch((error) => { document.body.dataset.testResult = error.message; });
`
const vite = await createServer({
  configFile: false,
  plugins: [react(), {
    name: 'refund-approval-fixture',
    enforce: 'pre',
    resolveId(id) {
      if (id.includes('utils/omniApi')) return '\0approval-api'
      if (id === '/approval-fixture.js') return '\0approval-fixture'
    },
    load(id) { if (id === '\0approval-api') return api; if (id === '\0approval-fixture') return fixture },
    configureServer(server) { server.middlewares.use(async (req, res, next) => {
      if (req.url.split('?')[0] !== '/') return next()
      res.setHeader('Content-Type', 'text/html')
      res.end(await server.transformIndexHtml('/', '<html><body><div id="app"></div><script type="module" src="/approval-fixture.js"></script></body></html>'))
    }) },
  }],
  server: { host: '127.0.0.1', port: 0 }, logLevel: 'error',
})
try {
  await vite.listen()
  const address = vite.httpServer.address()
  if (process.argv.includes('--preview')) {
    console.log('Preview: http://127.0.0.1:' + address.port + '/?preview=1')
    await new Promise((resolve) => process.once('SIGINT', resolve))
    process.exitCode = 0
  } else {
  const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const child = spawn(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--window-size=1280,1000', '--remote-debugging-port=0', `--user-data-dir=${profile}`])
  let socket
  try {
    const debugUrl = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 10_000)
      child.stderr.on('data', (chunk) => {
        const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/)
        if (match) { clearTimeout(timer); resolve(match[1]) }
      })
      child.on('error', reject)
    })
    const target = await fetch(`http://${new URL(debugUrl).host}/json/new?${encodeURIComponent(`http://127.0.0.1:${address.port}/`)}`, { method: 'PUT' }).then((res) => res.json())
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject) })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('UI test timeout')), 12_000)
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data)
        if (message.id === 1) { clearTimeout(timer); resolve(message.result) }
      })
      socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
        expression: `new Promise((resolve) => { let checks = 0; const timer = setInterval(() => {
          if (document.body?.dataset.testResult || ++checks > 300) {
            clearInterval(timer); resolve(document.body?.dataset.testResult ?? document.documentElement.outerHTML);
          }
        }, 30); })`, awaitPromise: true, returnByValue: true,
      } }))
    })
    assert.equal(result.result?.value, 'PASS', JSON.stringify(result))
  } finally { socket?.close(); child.kill(); await new Promise((resolve) => child.once('close', resolve)) }
  console.log('PASS: centered layout, typography, native focus, required reason, stable retry key, and no-transfer copy')
  }
} finally { await vite.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) }
