const puppeteer = require('puppeteer-core')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--window-size=1280,900'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.evaluateOnNewDocument(() => localStorage.clear())
  await page.goto('http://127.0.0.1:5234/', { waitUntil: 'networkidle2' })
  await sleep(1500)
  const click = async (name) => page.evaluate((n) => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').toLowerCase().includes(n.toLowerCase()))
    if (!b) return 'missing'
    b.click(); return 'clicked'
  }, name)
  console.log('new game', await click('new game'))
  await sleep(700)
  console.log('confirm', await click('confirm'))
  await sleep(1500)
  console.log('reveal', await click('move into my room'))
  await sleep(1200)
  console.log('--- panel state before ---')
  console.log(await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].map((x) => (x.textContent || '').trim().slice(0, 30))
    return b.slice(0, 40).join(' | ')
  }))
  console.log('shop click', await click('shop'))
  for (const t of [100, 300, 800]) {
    await sleep(t)
    console.log(`t+${t}`, await page.evaluate(() => document.body.innerText.toLowerCase().includes('campus mart')))
  }
  await browser.close()
})()
