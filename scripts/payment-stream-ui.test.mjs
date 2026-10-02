import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { verifyBrowserFixture } from './browserFixture.mjs'

let sequence = 0, payment, offline = false
let counts = { wallet: 0, topup: 0, streams: 0, authorized: 0, financial: 0 }
const connections = new Set()
const capabilities = { version: 'fixture', provider: 'singapay', methods: [
  { id: 'qris', label: 'QRIS', enabled: true, minAmount: 10000, maxAmount: 1000000 },
  { id: 'va', label: 'Virtual Account', enabled: true, minAmount: 10000, maxAmount: 1000000, banks: [{ code: 'BRI', name: 'BRI' }] },
] }
const json = (response, data) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(data)) }
const frame = () => `event: payment-status\ndata: ${JSON.stringify({ payment })}\n\n`
const fixture = `
import React, { useState } from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css'; import '/src/styles/ads/index.css'; import PaymentPage from '/src/pages/dashboard/PaymentPage.jsx';
localStorage.setItem('padu-auth', JSON.stringify({ accessToken:'browser-test-token' }));
window.walletChanges=0; window.complete=0;
function App() {
  const [page,setPage]=useState(0),[,rebind]=useState(0);
  window.paymentFixture={ reset:()=>setPage(value=>value+1), rebind:()=>rebind(value=>value+1) };
  return React.createElement(PaymentPage,{key:page,onWalletChanged:()=>window.walletChanges++,onPaymentComplete:()=>window.complete++,onBack:()=>{}})
}
const root=createRoot(document.getElementById('app'));
const wait=(ms=20)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){for(let i=0;i<350;i++){if(check())return;await wait()}throw Error('UI timeout: '+check.toString())}
const check=(condition,message)=>{if(!condition)throw Error(message)};
const control=async(path)=>fetch('/fixture/'+path).then(response=>response.json());
async function phase(method,offline=false){await control('phase?method='+method+'&offline='+Number(offline));window.walletChanges=0;window.complete=0;if(window.paymentFixture)window.paymentFixture.reset();else root.render(React.createElement(App));await until(()=>document.body.textContent.includes('Menunggu pembayaran'));}
async function run(){
  await phase('va'); await until(()=>document.querySelector('.pay-va strong'));
  check(document.querySelector('.pay-va strong').textContent==='1234567890','VA instructions lost');
  await wait(4200);let stats=await control('stats');check(stats.topup===1,'Healthy SSE unexpectedly polled');check(stats.wallet===1,'Wallet refreshed before credited');check(stats.authorized===1,'SSE lost bearer auth');
  await control('status?value=credit_pending');await until(()=>document.body.textContent.includes('Pembayaran diterima'));
  check(!document.querySelector('.pay-va'),'Paid instructions remained visible');
  await control('status?value=credited&duplicates=3');await until(()=>document.querySelector('.pay-success'));await until(()=>window.walletChanges===1);
  for(let i=0;i<3;i++){window.paymentFixture.rebind();await wait()}
  await wait(2200);stats=await control('stats');check(stats.wallet===2 && window.walletChanges===1 && window.complete===1,'Repeated credit or callback identity refreshed/completed more than once');
  check(stats.active===0,'Terminal payment kept its stream open');

  await phase('qris');await until(()=>document.querySelector('.pay-qr svg'));
  check(document.querySelector('.pay-qr svg').getAttribute('aria-label').includes('QRIS'),'QRIS label missing');
  await control('status?value=credit_pending');await until(()=>document.body.textContent.includes('Pembayaran diterima'));
  await control('status?value=credited');await until(()=>window.walletChanges===1);stats=await control('stats');check(stats.wallet===2,'QRIS credit did not refresh wallet');

  await phase('qris');await control('status?value=refund_pending');await until(()=>document.body.textContent.includes('Pengembalian dana sedang diproses'));
  await control('status?value=refund_processing');await wait();await control('status?value=refunded');await until(()=>document.body.textContent.includes('Dana telah dikembalikan'));
  stats=await control('stats');check(stats.wallet===1 && window.walletChanges===0,'Refund incorrectly credited wallet');

  await phase('va',true);await control('status?value=credited');await until(()=>document.querySelector('.pay-success'));await until(()=>window.walletChanges===1);
  stats=await control('stats');check(stats.topup===2 && stats.wallet===2 && stats.streams>=2,'Unavailable SSE did not use fallback polling');
  check(stats.financial===0,'Status checks triggered a financial request');document.body.dataset.testResult='PASS';
}
run().catch(error=>document.body.dataset.testResult=error.message);
`
const server = await createServer({ configFile: false, define: { 'import.meta.env.VITE_API_URL': 'window.location.origin' }, plugins: [react(), {
  name: 'payment-stream-fixture', enforce: 'pre',
  resolveId(id) { if (id === '/payment-stream-fixture.js') return '\0payment-stream-fixture' },
  load(id) { if (id === '\0payment-stream-fixture') return fixture },
  configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/fixture/phase') {
      for (const connection of connections) connection.end(); connections.clear()
      counts = { wallet: 0, topup: 0, streams: 0, authorized: 0, financial: 0 }
      offline = url.searchParams.get('offline') === '1'
      const method = url.searchParams.get('method')
      payment = { paymentId: `fixture-${++sequence}`, reference: `TOPUP-${sequence}`, provider: 'singapay', method, status: 'pending',
        amount: '10000', creditedBits: '40.000', currency: 'IDR', expiresAt: new Date(Date.now() + 60000).toISOString(),
        virtualAccount: method === 'va' ? { number: '1234567890', bankCode: 'BRI', name: 'Test store' } : null,
        qrisPayload: method === 'qris' ? 'synthetic-qris-fixture' : null }
      return json(res, {})
    }
    if (url.pathname === '/fixture/status') {
      payment = { ...payment, status: url.searchParams.get('value') }
      for (let i = 0; i < Number(url.searchParams.get('duplicates') ?? 1); i++) for (const connection of connections) connection.write(frame())
      return json(res, {})
    }
    if (url.pathname === '/fixture/stats') return json(res, { ...counts, active: connections.size })
    if (url.pathname.startsWith('/api/')) {
      if (req.headers.authorization !== 'Bearer browser-test-token') { res.statusCode = 401; return json(res, {}) }
      if (req.method !== 'GET') { counts.financial++; res.statusCode = 405; return json(res, {}) }
      if (url.pathname === '/api/wallet') { counts.wallet++; return json(res, { success: true, data: { balance: payment.status === 'credited' ? '40' : '0' } }) }
      if (url.pathname === '/api/wallet/topup') { counts.topup++; return json(res, { success: true, data: { payment, capabilities } }) }
      if (url.pathname === '/api/wallet/topup/events') {
        counts.streams++; counts.authorized++
        if (offline) { res.statusCode = 503; return json(res, {}) }
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }); res.write(frame())
        connections.add(res); res.on('close', () => connections.delete(res)); return
      }
    }
    if (url.pathname !== '/') return next()
    res.setHeader('Content-Type', 'text/html')
    res.end(await vite.transformIndexHtml('/', '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="padding:20px"><div id="app"></div><script type="module" src="/payment-stream-fixture.js"></script></body></html>'))
  }) },
}], server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
try { await server.listen(); await verifyBrowserFixture(`http://127.0.0.1:${server.httpServer.address().port}/`, { name: 'payment-stream' }) }
finally { for (const connection of connections) connection.end(); await server.close() }
