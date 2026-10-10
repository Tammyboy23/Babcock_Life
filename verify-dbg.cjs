const { spawn } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9335
const APP = 'http://127.0.0.1:5234'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(os.tmpdir(), `dbg-${Date.now()}`)}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let ws
  try {
    for (let i = 0; i < 60; i += 1) {
      try {
        await fetch(`http://127.0.0.1:${PORT}/json/version`)
        break
      } catch {
        await sleep(250)
      }
    }
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((res, rej) => {
      ws.addEventListener('open', res)
      ws.addEventListener('error', rej)
    })
    let id = 0
    const pending = new Map()
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message.result)
        pending.delete(message.id)
      }
    })
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const mid = ++id
        pending.set(mid, resolve)
        ws.send(JSON.stringify({ id: mid, method, params }))
      })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      return result?.result?.value
    }
    const clickText = (text) =>
      evaluate(`(() => {
        const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').toLowerCase().includes(${JSON.stringify(text)}))
        if (!el) return 'not-found'
        el.click()
        return 'clicked'
      })()`)

    await send('Page.enable')
    await send('Runtime.enable')
    await send('Page.navigate', { url: `${APP}/` })
    await sleep(1500)
    await evaluate('localStorage.clear()')
    await send('Page.navigate', { url: `${APP}/` })
    await sleep(1500)
    await clickText('start new life')
    await sleep(800)
    await evaluate(`(() => {
      const input = document.getElementById('student-name')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 'Tolu')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()`)
    await clickText('confirm & continue')
    await sleep(900)
    await clickText('move into my room')
    await sleep(1200)

    const matches = await evaluate(`JSON.stringify([...document.querySelectorAll('button')]
      .filter((b) => (b.textContent || '').toLowerCase().includes('shop'))
      .map((b) => ({ text: (b.textContent || '').slice(0, 40), title: b.getAttribute('title'), disabled: b.disabled })))`)
    console.log('buttons containing "shop":', matches)

    console.log('click HUD shop ->', await clickText('shop'))
    await sleep(900)
    console.log('panel open?', await evaluate('document.body.innerText.toLowerCase().includes("everything you buy")'))
    console.log('body tail:', (await evaluate('document.body.innerText')).slice(-400))

    console.log('click by title Shop ->', await evaluate(`(() => {
      const el = [...document.querySelectorAll('button')].find((b) => b.getAttribute('title') === 'Shop')
      if (!el) return 'not-found'
      el.click()
      return 'clicked'
    })()`))
    await sleep(900)
    console.log('panel open now?', await evaluate('document.body.innerText.toLowerCase().includes("everything you buy")'))
  } finally {
    try {
      ws?.close()
    } catch {}
    chrome.kill()
  }
}

main().catch((error) => {
  console.error('DBG CRASH', error)
  process.exitCode = 1
})
