import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { verifyBrowserFixture } from './browserFixture.mjs'

const fixture = `
import React, { useState } from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css'; import '/src/styles/ads/index.css'; import '/src/pages/dashboard/PaymentPage.css';
import Form from '/src/pages/dashboard/PaymentForm.jsx';
const banks = ['BCA','BNC','BNI','BRI','BSI','CIMB','DANAMON','MANDIRI','MAYBANK','MUAMALAT','OCBC','PERMATA'].map(code => ({ code, name: code }));
window.requests = []; let control;
function App() {
  const [value, change] = useState('BRI'), [disabled, busy] = useState(false), [choices, setChoices] = useState(banks);
  control = { busy, setChoices };
  return React.createElement('div', {className:'pay'}, React.createElement('h1',null,'Isi saldo prabayar'),
    React.createElement('div',{className:'pay-grid'}, React.createElement('section',{className:'pay-card pay-balance'},
      React.createElement('span',null,'Saldo tersedia'),React.createElement('strong',null,'200 bit')),
      React.createElement(Form,{ amount:'200', bankCode:value, busy:disabled, method:'va',
        onAmountChange:()=>{},onBankChange:change,onMethodChange:()=>{},
        onSubmit:event=>{event.preventDefault();window.requests.push(value)},
        capabilities:{methods:[{id:'va',label:'Virtual Account',enabled:true,banks:choices,minAmount:10000,maxAmount:1000000}]}
      })))
}
createRoot(document.getElementById('app')).render(React.createElement(App));
const wait = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) { for(let i=0;i<250;i++){ if(check()) return; await wait() } throw Error('UI timeout: ' + check.toString()) }
const key = (node, value) => node.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles:true, cancelable:true }));
const check = (condition, message) => { if(!condition) throw Error(message) };
async function run() {
  await until(() => document.querySelector('[role="combobox"]'));
  const button = document.querySelector('[role="combobox"]'); button.focus(); key(button, 'ArrowDown');
  await until(() => document.querySelectorAll('[role="option"]').length === 12);
  check(button.getAttribute('aria-expanded') === 'true', 'Expansion inaccessible');
  check(document.getElementById(button.getAttribute('aria-activedescendant'))?.textContent.includes('BRI'), 'Selected active descendant lost');
  check([...document.querySelectorAll('[role="option"]')].map(node=>node.textContent).join(',') === banks.map(bank=>bank.name).join(','), 'Backend ordering changed');
  await until(() => [...document.querySelectorAll('.pay-bank-options img')].every(image=>image.complete && image.naturalWidth));
  check([...document.querySelectorAll('.pay-bank-options img')].every(image=>image.src.endsWith('.webp')), 'Nonlocal or non-WebP logo');
  key(button,'End'); await wait(); key(button,'Enter'); await until(()=>button.textContent.includes('PERMATA'));
  check(!document.querySelector('[role="listbox"]') && document.activeElement === button, 'Selection did not close with focus retained');
  key(button,'Home'); await wait(); key(button,'Enter'); await until(()=>button.textContent.includes('BCA'));
  key(button,'ArrowDown'); key(button,'m'); await wait(); key(button,'Enter'); await until(()=>button.textContent.includes('MANDIRI'));
  check(window.requests.length === 0, 'Keyboard selection submitted a payment');
  key(button,'ArrowDown'); key(button,'Escape'); await wait(); check(!document.querySelector('[role="listbox"]'), 'Escape did not dismiss');
  button.click(); await wait(); key(button,'Tab'); await wait(); check(!document.querySelector('[role="listbox"]'), 'Tab did not dismiss');
  button.click(); await wait(); document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); await wait(); check(!document.querySelector('[role="listbox"]'), 'Outside did not dismiss');
  control.busy(true); await until(()=>button.disabled); button.click(); check(!document.querySelector('[role="listbox"]'), 'Busy control reopened');
  control.busy(false); control.setChoices([]); await wait(); await until(()=>button.disabled); check(button.textContent.includes('Pilih bank'), 'Empty choices lost fallback');
  control.setChoices([{code:'FUTURE', name:'Bank baru'}, ...banks.slice(0,2)]); await until(()=>!button.disabled); button.click(); await wait();
  const options=[...document.querySelectorAll('[role="option"]')]; options[0].click(); await until(()=>button.textContent.includes('Bank baru'));
  check(!button.querySelector('img') && button.querySelector('svg'), 'Unknown logo fallback lost');
  button.click(); await wait(); document.querySelectorAll('[role="option"]')[1].click(); await until(()=>button.textContent.includes('BCA'));
  button.querySelector('img').dispatchEvent(new Event('error')); await wait(); check(!button.querySelector('img'), 'Failed image has no fallback');
  control.setChoices(banks); await wait(); button.click(); await until(()=>document.querySelectorAll('[role="option"]').length===12);
  document.querySelectorAll('[role="option"]')[3].click(); await until(()=>button.textContent.includes('BRI')); button.click(); await wait();
  const rect = document.querySelector('[role="listbox"]').getBoundingClientRect();
  check(rect.left>=0 && rect.right<=innerWidth && rect.top>=0 && rect.bottom<=innerHeight, 'Popup clipped by viewport');
  check(button.getBoundingClientRect().height>=44 && [...document.querySelectorAll('[role="option"]')].every(node=>node.getBoundingClientRect().height>=44), 'Touch targets too small');
  document.body.dataset.testResult='PASS';
}
run().catch(error => document.body.dataset.testResult=error.message);
`
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'bank-fixture', enforce: 'pre',
  resolveId(id) { if (id === '/bank-fixture.jsx') return '\0bank-fixture.jsx' },
  load(id) { if (id === '\0bank-fixture.jsx') return fixture },
  configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
    if (req.url.split('?')[0] !== '/') return next()
    res.setHeader('Content-Type','text/html')
    res.end(await vite.transformIndexHtml('/', '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="padding:20px"><div id="app"></div><script type="module" src="/bank-fixture.jsx"></script></body></html>'))
  }) },
}], server: { host:'127.0.0.1', port:0 }, logLevel:'error' })
try { await server.listen(); const url = `http://127.0.0.1:${server.httpServer.address().port}/`; if (process.argv.includes('--preview')) { console.log(url); await new Promise(resolve => process.once('SIGINT', resolve)) } else await verifyBrowserFixture(url, { name:'banks' }) }
finally { await server.close() }
