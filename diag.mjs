import { chromium } from 'playwright'
const browser = await chromium.launch()
const d = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const dp = await d.newPage()
await dp.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await dp.waitForTimeout(3000)
const info = await dp.evaluate(() => {
  return [...document.querySelectorAll('section')].map((e) => ({
    cls: e.className.slice(0, 40),
    opacity: getComputedStyle(e).opacity,
    transform: getComputedStyle(e).transform,
  }))
})
await dp.screenshot({ path: 'settled.png', fullPage: true })
console.log(JSON.stringify(info, null, 2))
await browser.close()
