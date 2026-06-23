import { chromium, devices } from 'playwright'
const URL = 'http://localhost:5173'
const browser = await chromium.launch()

// desktop — collect any console errors/warnings through full settle
const d = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const dp = await d.newPage()
const msgs = []
dp.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(m.type() + ': ' + m.text().slice(0,120)) })
dp.on('pageerror', (e) => msgs.push('pageerror: ' + e.message.slice(0,120)))
await dp.goto(URL, { waitUntil: 'networkidle' })
await dp.waitForTimeout(2500)
const allVisible = await dp.evaluate(() => {
  const sel = ['header', 'aside', 'section']
  const bad = []
  sel.forEach((s) => document.querySelectorAll('main ' + s + ', ' + s).forEach((e) => {
    if (parseFloat(getComputedStyle(e).opacity) < 0.99) bad.push(s)
  }))
  return [...new Set(bad)]
})
await d.close()

// reduced motion — content present immediately
const r = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const rp = await r.newPage()
await rp.goto(URL, { waitUntil: 'domcontentloaded' })
await rp.waitForTimeout(120)
const rmOpacity = await rp.evaluate(() => getComputedStyle(document.querySelector('section')).opacity)
await r.close()

// mobile — drawer must still open correctly after wrapping the sidebar content
const m = await browser.newContext({ ...devices['iPhone 13'] })
const mp = await m.newPage()
await mp.goto(URL, { waitUntil: 'networkidle' })
await mp.waitForTimeout(1500)
await mp.getByRole('button', { name: 'Toggle navigation' }).click()
await mp.waitForTimeout(500)
const drawer = await mp.evaluate(() => {
  const aside = document.querySelector('aside')
  const r = aside.getBoundingClientRect()
  return { left: Math.round(r.left), top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width), vh: window.innerHeight }
})
await mp.screenshot({ path: 'mobile-drawer.png' })
await m.close()

await browser.close()
console.log(JSON.stringify({ consoleMsgs: msgs, stuckSelectors: allVisible, reducedMotionOpacity: rmOpacity, drawer }, null, 2))
