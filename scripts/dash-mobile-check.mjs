import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = path.join(__dirname, 'screenshots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const BASE = 'http://localhost:3001'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 })
await page.waitForTimeout(2500)

// Overflow check
const overflow = await page.evaluate(() => ({
  bodyScrollWidth: document.body.scrollWidth,
  bodyClientWidth: document.body.clientWidth,
  hasOverflow: document.body.scrollWidth > document.body.clientWidth,
}))

await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-390-dashboard-fixed.png'), fullPage: true })

// Also check hero card height
const heroHeight = await page.evaluate(() => {
  const hero = document.querySelector('section')
  return hero ? hero.getBoundingClientRect().height : null
})

console.log(`Overflow: ${overflow.hasOverflow ? '❌ YES' : '✅ none'} (body ${overflow.bodyScrollWidth} vs ${overflow.bodyClientWidth})`)
console.log(`Hero card height: ${heroHeight?.toFixed(0)}px`)
console.log('Screenshot saved.')

await browser.close()
