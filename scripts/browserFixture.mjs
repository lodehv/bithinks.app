import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

export async function verifyBrowserFixture(url, { widths = [375, 768, 1024, 1440], name = 'payment' } = {}) {
  const profile = await mkdtemp(join(tmpdir(), 'payment-browser-'))
  const chrome = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`])
  let socket
  try {
    const debuggerUrl = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 10000)
      chrome.stderr.on('data', (chunk) => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]) } })
      chrome.on('error', reject)
    })
    const target = await fetch(`http://${new URL(debuggerUrl).host}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json())
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject) })
    let nextId = 0
    const pending = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.method === 'Runtime.exceptionThrown') console.error(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
      const callback = pending.get(message.id)
      if (callback) { pending.delete(message.id); callback(message) }
    })
    const request = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId, timer = setTimeout(() => reject(Error(`${method} timed out`)), 20000)
      pending.set(id, (message) => { clearTimeout(timer); if (message.error) reject(Error(JSON.stringify(message.error))); else resolve(message.result) })
      socket.send(JSON.stringify({ id, method, params }))
    })
    await request('Runtime.enable'); await request('Page.enable')
    for (const width of widths) {
      await request('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 375 })
      await request('Page.navigate', { url: `${url}?width=${width}` })
      const result = await request('Runtime.evaluate', { expression: `new Promise(resolve => { let count = 0; const timer = setInterval(() => { if (document.body?.dataset.testResult || ++count > 800) { clearInterval(timer); resolve(document.body?.dataset.testResult ?? 'UI timeout: ' + location.href + ' ' + document.documentElement.outerHTML.slice(0,1200)) } }, 20) })`, awaitPromise: true, returnByValue: true })
      assert.equal(result.result?.value, 'PASS', JSON.stringify(result))
      if (name === 'banks' && width === 375) {
        await request('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
        const point = await request('Runtime.evaluate', { expression: `const r = document.querySelectorAll('[role="option"]')[1].getBoundingClientRect(); ({ x:r.x+r.width/2, y:r.y+r.height/2 })`, returnByValue:true })
        await request('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[point.result.value] })
        await request('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] })
        const selected = await request('Runtime.evaluate', { expression: `new Promise(resolve=>setTimeout(()=>resolve(document.querySelector('[role="combobox"]').textContent.includes('BNC') && !document.querySelector('[role="listbox"]')),50))`, awaitPromise:true, returnByValue:true })
        assert.equal(selected.result.value,true,'Touch selection failed')
        await request('Runtime.evaluate', { expression:`document.querySelector('[role="combobox"]').focus()` })
        await request('Input.dispatchKeyEvent', { type:'keyDown', key:'ArrowDown', code:'ArrowDown' })
        await request('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 })
        await request('Input.dispatchKeyEvent', { type:'keyUp', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 })
        const tabbed = await request('Runtime.evaluate', { expression:`!document.querySelector('[role="listbox"]') && document.activeElement !== document.querySelector('[role="combobox"]')`, returnByValue:true })
        assert.equal(tabbed.result.value,true,'Native Tab did not move focus and dismiss')
        await request('Runtime.evaluate', { expression:`document.querySelector('[role="combobox"]').click()` })
      }
      for (const theme of ['light', 'dark']) {
        const layout = await request('Runtime.evaluate', { expression: `document.documentElement.dataset.dsTheme = '${theme}'; ({ width: innerWidth, scroll: document.documentElement.scrollWidth, logoBackground: getComputedStyle(document.querySelector('.pay-bank-logo') ?? document.body).backgroundColor })`, returnByValue: true })
        assert.ok(layout.result.value.scroll <= layout.result.value.width, `horizontal overflow at ${width}/${theme}`)
        if (name === 'banks') assert.equal(layout.result.value.logoBackground, 'rgb(255, 255, 255)')
        const screenshot = await request('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(tmpdir(), `bithinks-${name}-${width}-${theme}.png`), Buffer.from(screenshot.data, 'base64'))
      }
      console.log(`PASS: ${name} browser interactions and layout at ${width}px`)
    }
  } finally {
    socket?.close(); chrome.kill(); await new Promise((resolve) => chrome.once('close', resolve))
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}
