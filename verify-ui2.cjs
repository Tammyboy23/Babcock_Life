/* Temporary check: every panel, purchase and persistence path must work end to end. */
const { spawn } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9334
const APP = 'http://127.0.0.1:5234'
const USER_DIR = path.join(os.tmpdir(), `babcock-cdp2-${Date.now()}`)

const log = (...args) => console.log(...args)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DIR}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const consoleErrors = []
  const exceptions = []
  let ws

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        await fetch(`http://127.0.0.1:${PORT}/json/version`)
        break
      } catch {
        await sleep(250)
      }
    }
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve)
      ws.addEventListener('error', reject)
    })

    let nextId = 0
    const pending = new Map()
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id)
        pending.delete(message.id)
        if (message.error) reject(new Error(JSON.stringify(message.error)))
        else resolve(message.result)
        return
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        consoleErrors.push(message.params.args.map((a) => a.value ?? a.description).join(' '))
      }
      if (message.method === 'Runtime.exceptionThrown') {
        exceptions.push(message.params.exceptionDetails.exception?.description ?? 'unknown')
      }
    })

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId
        pending.set(id, { resolve, reject })
        ws.send(JSON.stringify({ id, method, params }))
      })

    await send('Page.enable')
    await send('Runtime.enable')

    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed')
      return result.result.value
    }
    const body = async () => (await evaluate('document.body.innerText')).toLowerCase()
    const clickText = async (text) =>
      evaluate(`(() => {
        const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))
        if (!el) return 'not-found'
        el.click()
        return 'clicked'
      })()`)
    /** Clicks the last button whose trimmed label is exactly this text (modal tabs, toggles). */
    const clickExact = async (text) =>
      evaluate(`(() => {
        const matches = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())})
        if (!matches.length) return 'not-found'
        matches[matches.length - 1].click()
        return 'clicked'
      })()`)
    const closePanel = async () => {
      await evaluate('[...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Close")?.click()')
      await sleep(400)
    }
    const clearStrayOverlays = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const text = await body()
        if (text.includes('every choice changes your money')) {
          await evaluate(`(() => {
            const panels = [...document.querySelectorAll('div')]
            const panel = panels.find((d) => (d.className || '').toString().includes('panel') && d.innerText.includes('every choice changes'))
            const button = panel?.querySelector('button')
            if (button) { button.click(); return true }
            return false
          })()`)
          await sleep(500)
          continue
        }
        const resultOpen = await evaluate('Boolean([...document.querySelectorAll("button")].find((b) => (b.textContent || "").toLowerCase().trim().startsWith("continue")))')
        if (resultOpen) {
          await clickText('continue')
          await sleep(400)
          continue
        }
        if (text.includes('end conversation')) {
          await clickText('end conversation')
          await sleep(300)
          continue
        }
        return
      }
    }
    /** Clicks the action button of the smallest card inside the open modal that mentions `name`. */
    const clickCardButton = async (name) =>
      evaluate(`(() => {
        const modal = document.querySelector('.panel.relative')
        if (!modal) return 'no-modal'
        const nodes = [...modal.querySelectorAll('div')]
          .filter((d) => (d.innerText || '').toLowerCase().includes(${JSON.stringify(name.toLowerCase())}) && d.querySelector('button'))
          .sort((a, b) => a.innerText.length - b.innerText.length)
        const card = nodes[0]
        if (!card) return 'no-card'
        const button = card.querySelector('button')
        if (button.disabled) return 'disabled'
        button.click()
        return 'clicked'
      })()`)
    const waitFor = async (predicate, label, timeoutMs = 12000) => {
      const started = Date.now()
      while (Date.now() - started < timeoutMs) {
        if (await evaluate(predicate).catch(() => false)) return true
        await sleep(250)
      }
      throw new Error(`timed out: ${label}`)
    }

    const saveFromStorage = () => evaluate('localStorage.getItem("babcock-life-save-v2")')

    const results = []
    const record = (name, ok, detail = '') => {
      results.push({ name, ok, detail })
      log(`${ok ? 'PASS' : 'FAIL'} :: ${name}${detail ? ` :: ${detail}` : ''}`)
    }

    await send('Page.navigate', { url: `${APP}/` })
    await sleep(1200)
    await evaluate('localStorage.clear()')
    await send('Page.navigate', { url: `${APP}/` })
    await sleep(1200)
    await waitFor('document.body.innerText.toLowerCase().includes("babcock")', 'menu')

    await clickText('start new life')
    await waitFor('Boolean(document.getElementById("student-name"))', 'character creator')
    await evaluate(`(() => {
      const input = document.getElementById('student-name')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 'Tolu')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()`)
    await clickText('confirm & continue')
    await waitFor('document.body.innerText.toLowerCase().includes("move into my room")', 'reveal')
    const revealText = await body()
    const lifestyle = revealText.includes('nepo') ? 'NEPO' : 'LAPO'
    await clickText('move into my room')
    await waitFor('document.body.innerText.toLowerCase().includes("room notes")', 'hostel room notes')

    const hostelText = await body()
    record(
      'hostel shows a lifestyle-specific room description',
      lifestyle === 'NEPO'
        ? hostelText.includes('premium double room')
        : hostelText.includes('modest room: bunk mattress'),
      lifestyle,
    )
    record('room notes name the lifestyle', hostelText.includes(`${lifestyle.toLowerCase()} room:`))

    const balanceOf = async (text) => Number(((text.match(/₦([\d,]+)/) || ['', '0'])[1] || '0').replace(/,/g, ''))
    const startBalance = await balanceOf(hostelText)
    const dbg = async (tag) => log('DBG', tag, JSON.stringify((JSON.parse(await saveFromStorage()) || {}).balance), JSON.stringify((JSON.parse(await saveFromStorage()) || {}).inventory))
    await dbg('after room')

    // ---------------------------------------------------------------- shop panel
    await clearStrayOverlays()
    await clickText('shop')
    await waitFor('document.body.innerText.toLowerCase().includes("everything you buy")', 'shop panel')

    await dbg('shop open')
    await clickExact('gifts')
    await sleep(400)
    record('shop gift tab lists gifts', (await body()).includes('chocolate bar'))
    await clickCardButton('Chocolate Bar')
    await sleep(500)
    record('buying a gift adds it to the inventory', (await body()).includes('added to your inventory'))

    await clickExact('outfits')
    await sleep(300)
    await clickCardButton('Sporty Kit')
    await sleep(500)
    record('buying an outfit succeeds', (await body()).includes('added to your inventory'))

    await clickExact('room')
    await sleep(300)
    await clickCardButton('Potted Palm')
    await sleep(500)
    const afterFurniture = await body()
    record('buying furniture installs it in the room', afterFurniture.includes('installed in your room'))
    record('the furniture card switches to installed', afterFurniture.includes('installed'))

    await clickExact('snacks')
    await sleep(300)
    const balanceBeforeSnack = await balanceOf(afterFurniture)
    await clickCardButton('Biscuit Pack')
    await sleep(500)
    record('buying a snack deducts money', (await balanceOf(await body())) === balanceBeforeSnack - 300)

    await closePanel()
    await dbg('before close')
    const spentByShop = startBalance - (await balanceOf(await body()))
    record('the shop charged exactly for the basket', spentByShop === 4_000 + 4_500 + 300 + 1_500, `${startBalance} -> spent ${spentByShop}`)

    // ---------------------------------------------------------------- bag / inventory
    await clearStrayOverlays()
    await clickText('bag')
    await waitFor('document.body.innerText.toLowerCase().includes("inventory")', 'inventory panel')
    const bagText = await body()
    record('bag lists the purchased outfit', bagText.includes('sporty kit'))
    record('bag lists the purchased furniture', bagText.includes('potted palm'))
    record('bag lists the purchased gift', bagText.includes('chocolate bar'))

    await clickCardButton('Sporty Kit')
    await sleep(500)
    record('wearing an owned outfit from the bag works', (await body()).includes('wearing'))

    const beforeUse = await body()
    await clickCardButton('Biscuit Pack')
    await sleep(500)
    const afterUse = await body()
    record('using a snack from the bag consumes it', afterUse !== beforeUse && !afterUse.includes('biscuit pack x'))

    await closePanel()

    // ---------------------------------------------------------------- profile panel
    await clearStrayOverlays()
    await clickText('profile')
    await waitFor('document.body.innerText.toLowerCase().includes("student profile")', 'profile panel')
    const profileText = await body()
    record('profile shows the appearance editor', profileText.includes('appearance'))
    record('profile shows the needs block', profileText.includes('current needs'))
    const hairBefore = (profileText.match(/style (\d)/) || [])[1]
    await clickText('bun')
    await sleep(500)
    const hairAfter = ((await body()).match(/style (\d)/) || [])[1]
    record('changing hairstyle in the profile updates it', hairBefore !== hairAfter, `${hairBefore} -> ${hairAfter}`)
    await closePanel()

    // ---------------------------------------------------------------- settings panel
    await evaluate('[...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").includes("Settings"))?.click()')
    await waitFor('document.body.innerText.toLowerCase().includes("settings")', 'settings panel')
    record('settings shows audio and interface sections', (await body()).includes('master volume'))
    await clickText('scene animations and transitions')
    await sleep(400)
    const afterToggleOff = JSON.parse(await saveFromStorage()).settings.animations
    await clickText('scene animations and transitions')
    await sleep(400)
    const afterToggleOn = JSON.parse(await saveFromStorage()).settings.animations
    record('interface toggles persist to the save', afterToggleOff === false && afterToggleOn === true, `${afterToggleOff} -> ${afterToggleOn}`)
    await clickText('mute audio')
    await sleep(400)
    record('mute persists to the save', JSON.parse(await saveFromStorage()).settings.muted === true)
    await clickText('unmute audio')
    await sleep(400)
    await closePanel()

    // ---------------------------------------------------------------- persistence
    await clearStrayOverlays()
    await clickText('travel')
    await waitFor('document.body.innerText.toLowerCase().includes("campus map")', 'map')
    await clickText('campus mart')
    await sleep(800)
    const reopened = JSON.parse(await saveFromStorage())
    record('outfit purchase persisted', reopened.inventory.includes('outfit-sport'))
    record('furniture purchase persisted', reopened.equipment.furniture.plant === 'furn-plant')
    record('equipped outfit persisted', reopened.profile.outfitId === 'outfit-sport')
    record('appearance change persisted', reopened.profile.hairStyle === 3)

    // ---------------------------------------------------------------- save + continue
    await clearStrayOverlays()
    const beforePause = await body()
    const dayBefore = beforePause.match(/day (\d+)/)?.[1]
    const balancePrePause = (beforePause.match(/₦[\d,]+/) || [''])[0]
    await evaluate('[...document.querySelectorAll("button")].find((b) => b.title === "Pause (Esc)")?.click()')
    await waitFor('document.body.innerText.toLowerCase().includes("paused")', 'pause menu')
    await clickText('save & return to main menu')
    await waitFor('document.body.innerText.toLowerCase().includes("continue game")', 'main menu with save')
    const menuText = await body()
    record(
      'main menu summarises the save',
      menuText.includes('tolu') && menuText.includes(lifestyle.toLowerCase()),
      menuText.includes('day') ? 'clock shown' : '',
    )
    await clickText('continue game')
    await waitFor('document.body.innerText.toLowerCase().includes("campus mart")', 'continued game')
    const continued = await body()
    const dayAfter = continued.match(/day (\d+)/)?.[1]
    const balanceAfterContinue = (continued.match(/₦[\d,]+/) || [''])[0]
    record('continue restores the same day', dayBefore === dayAfter, `${dayBefore} -> ${dayAfter}`)
    record('continue restores the balance', balancePrePause === balanceAfterContinue, `${balancePrePause} -> ${balanceAfterContinue}`)
    record('continue restores the location', continued.includes('campus mart'))

    // ---------------------------------------------------------------- reset confirmation
    await evaluate('[...document.querySelectorAll("button")].find((b) => b.title === "Pause (Esc)")?.click()')
    await waitFor('document.body.innerText.toLowerCase().includes("paused")', 'pause menu again')
    await clickText('reset save')
    await sleep(300)
    const confirmText = await body()
    record('reset asks for confirmation first', confirmText.includes('yes, delete everything'))
    await clickText('cancel')
    await sleep(300)
    await clickText('resume')
    await sleep(500)
    record('cancelling reset keeps the save', (await saveFromStorage())?.length > 0)

    // the allowance and lifestyle must survive a reload without rerolling
    await send('Page.navigate', { url: `${APP}/` })
    await sleep(1400)
    const reloaded = JSON.parse(await saveFromStorage())
    record('lifestyle never rerolls on reload', reloaded.lifestyle === lifestyle, `${lifestyle} -> ${reloaded.lifestyle}`)
    record(
      'starting allowance is granted exactly once',
      reloaded.balance === (lifestyle === 'NEPO' ? 500_000 : 50_000) + 5_000 - (4_000 + 4_500 + 300 + 1_500),
      `${reloaded.balance}`,
    )

    record('no console errors were logged', consoleErrors.length === 0, `${consoleErrors.length}`)
    record('no uncaught exceptions were logged', exceptions.length === 0, `${exceptions.length}`)

    for (const error of consoleErrors.slice(0, 5)) log(`  console: ${error}`)
    for (const error of exceptions.slice(0, 5)) log(`  exception: ${error}`)
    const failed = results.filter((entry) => !entry.ok)
    log(`\nSUMMARY total=${results.length} failures=${failed.length}`)
    process.exitCode = failed.length === 0 ? 0 : 1
  } finally {
    try {
      ws?.close()
    } catch {
      // ignore
    }
    chrome.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
