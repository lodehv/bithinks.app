import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'refund-disbursement-test-'))
const api = `export const adminApi = { refundDisbursement: async (...args) => {
  window.calls.push(args); if (window.calls.length === 1) throw Error('timeout');
  return { state: 'READY', accountName: 'Sandbox Dummy' };
} }`
const fixture = `
import React from 'react'; import { createRoot } from 'react-dom/client';
import Dialog from '/src/pages/dashboard/RefundDisbursementDialog.jsx';
import Actions from '/src/pages/dashboard/RefundDisbursementActions.jsx';
window.calls = []; const root = createRoot(document.getElementById('app'));
const row = { reference: 'TOPUP-TEST', amount: '10000', refund: { id: 'refund-test', approval: {} } };
const wait = () => new Promise(r => setTimeout(r, 30));
async function until(check) { for (let i=0;i<100;i++) { if(check()) return; await wait(); } throw Error('UI timed out'); }
const set = (node, value) => { Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, value); node.dispatchEvent(new Event('input', { bubbles:true })); };
(async () => {
 root.render(React.createElement(Actions, { refund: { approval: {}, disbursement: { state:'UNCERTAIN', dispatchedAt:'2026-09-28' } }, onAction:()=>{} }));
 await until(()=>document.querySelector('button'));
 if (document.querySelector('button').textContent !== 'Cek status' || document.body.textContent.includes('Kirim refund')) throw Error('Uncertain resend guard missing');
 root.render(React.createElement(Actions, { refund: { approval:{}, canSendDisbursement:false, disbursement:{state:'READY'} }, onAction:()=>{} }));
 await until(()=>document.querySelector('button')?.textContent==='Kirim refund');
 if (!document.querySelector('button').disabled) throw Error('Dormant send guard missing');
 root.render(React.createElement(Dialog, { row, action:'prepare', onClose:()=>{}, onCompleted:()=>{document.body.dataset.done='yes'} }));
 await until(()=>document.querySelector('dialog[open]'));
 const reason = document.querySelector('textarea'), account = document.querySelector('input');
 if (!reason.required || document.activeElement!==reason || !account.required) throw Error('Input/accessibility guard missing');
 set(reason,'Recipient confirmed'); set(account,'200212345678900');
 const submit = document.querySelector('[type=submit]'); await until(()=>!submit.disabled);
 submit.click(); submit.click(); await until(()=>document.querySelector('[role=alert]'));
 if (window.calls.length!==1 || !account.disabled || !reason.disabled) throw Error('Double-click/payload guard missing');
 submit.click(); await until(()=>document.body.dataset.done==='yes');
 if (JSON.stringify(window.calls[0])!==JSON.stringify(window.calls[1])) throw Error('Retry identity changed');
 if (window.calls[0][1].amount!==undefined) throw Error('Client supplied amount');
 root.render(React.createElement(Dialog, { key:'send', row:{...row,refund:{...row.refund,disbursement:{accountName:'Sandbox Dummy',accountLast4:'8900',bankCode:'002',feeIdr:'2500',grossAmountIdr:'12500'}}}, action:'send', onClose:()=>{}, onCompleted:()=>{document.body.dataset.sent='yes'} }));
 await until(()=>document.querySelector('dialog[open] h2')?.textContent==='Kirim refund?');
 if (document.querySelector('input') || !document.body.textContent.includes('Sandbox Dummy')) throw Error('Transfer confirmation missing');
 set(document.querySelector('textarea'),'Approved recipient and fee');
 await until(()=>!document.querySelector('[type=submit]').disabled); document.querySelector('[type=submit]').click();
 await until(()=>document.body.dataset.sent==='yes');
 if (JSON.stringify(window.calls[2][1])!==JSON.stringify({action:'send',reason:'Approved recipient and fee'})) throw Error('Transfer truth supplied by browser');
 document.body.dataset.testResult='PASS';
})().catch(e=>document.body.dataset.testResult=e.message);
`
const vite = await createServer({ configFile: false, plugins: [react(), {
  name: 'refund-disbursement-fixture', enforce: 'pre',
  resolveId(id) { if(id.includes('utils/omniApi')) return '\0refund-api'; if(id==='/refund-fixture.js') return '\0refund-fixture' },
  load(id) { if(id==='\0refund-api') return api; if(id==='\0refund-fixture') return fixture },
  configureServer(server) { server.middlewares.use(async(req,res,next)=>{
    if(req.url!=='/')return next();res.setHeader('Content-Type','text/html');
    res.end(await server.transformIndexHtml('/', '<html><body><div id="app"></div><script type="module" src="/refund-fixture.js"></script></body></html>'))
  }) },
}], server:{host:'127.0.0.1',port:0}, logLevel:'error' })
try {
  await vite.listen()
  const child = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`])
  let socket
  try {
    const url = await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),10000)
      child.stderr.on('data',chunk=>{const match=String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);resolve(match[1])}})
      child.on('error',reject)
    })
    const target=await fetch(`http://${new URL(url).host}/json/new?${encodeURIComponent(`http://127.0.0.1:${vite.httpServer.address().port}/`)}`,{method:'PUT'}).then(r=>r.json())
    socket=new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve);socket.addEventListener('error',reject)})
    await new Promise(resolve=>setTimeout(resolve,500))
    const result=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('UI test timeout')),12000)
      socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id===1){clearTimeout(timer);resolve(msg.result)}})
      socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:`new Promise(resolve=>{let checks=0;const t=setInterval(()=>{if(document.body?.dataset.testResult||++checks>300){clearInterval(t);resolve(document.body?.dataset.testResult??document.documentElement.outerHTML)}},30)})`,awaitPromise:true,returnByValue:true}}))
    })
    assert.equal(result.result?.value,'PASS',JSON.stringify(result))
    console.log('PASS: recipient validation, required reason, frozen retry identity, double-click guard, dormant send, uncertain inquiry-only, server-owned money')
  } finally { socket?.close();child.kill();await new Promise(resolve=>child.once('close',resolve)) }
} finally { await vite.close(); await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100}) }
