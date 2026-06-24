/**
 * Mobile overflow check — takes screenshots at 390px, 768px, 1024px
 * across all routes and measures scrollWidth vs clientWidth to detect
 * horizontal overflow. Saves PNGs to scripts/screenshots/.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = path.join(__dirname, 'screenshots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const BASE = 'http://localhost:3001'

const VIEWPORTS = [
  { label: 'mobile-390',  width: 390,  height: 844 },
  { label: 'tablet-768',  width: 768,  height: 1024 },
  { label: 'laptop-1024', width: 1024, height: 768 },
]

const ROUTES = [
  { path: '/',               name: 'dashboard' },
  { path: '/products',       name: 'products' },
  { path: '/suppliers',      name: 'suppliers' },
  { path: '/sales-orders',   name: 'sales-orders' },
  { path: '/stock-control',  name: 'stock-control' },
  { path: '/price-list',     name: 'price-list' },
  { path: '/report',         name: 'report' },
  { path: '/account',        name: 'account' },
]

const browser = await chromium.launch()
const results = []

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route.path, { waitUntil: 'load', timeout: 15000 })
      // Wait for JS hydration / animations to settle
      await page.waitForTimeout(2500)

      // Measure horizontal overflow on <body> and <html>
      const overflow = await page.evaluate(() => {
        const body = document.body
        const html = document.documentElement
        return {
          bodyScrollWidth:  body.scrollWidth,
          bodyClientWidth:  body.clientWidth,
          htmlScrollWidth:  html.scrollWidth,
          htmlClientWidth:  html.clientWidth,
          hasOverflow: body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth,
        }
      })

      const shotFile = `${vp.label}__${route.name}.png`
      await page.screenshot({
        path: path.join(SHOT_DIR, shotFile),
        fullPage: true,
      })

      const status = overflow.hasOverflow ? '❌ OVERFLOW' : '✅ ok'
      const detail = overflow.hasOverflow
        ? ` (body ${overflow.bodyScrollWidth}>${overflow.bodyClientWidth}, html ${overflow.htmlScrollWidth}>${overflow.htmlClientWidth})`
        : ''

      results.push({ vp: vp.label, route: route.name, status, detail, shotFile })
      console.log(`${status}  ${vp.label}  /${route.name}${detail}`)
    } catch (err) {
      results.push({ vp: vp.label, route: route.name, status: '⚠️ ERROR', detail: String(err), shotFile: '' })
      console.log(`⚠️ ERROR  ${vp.label}  /${route.name}  ${err.message}`)
    }
  }

  await context.close()
}

await browser.close()

// Summary
const failures = results.filter(r => r.status.startsWith('❌') || r.status.startsWith('⚠️'))
console.log('\n─────────────────────────────────')
if (failures.length === 0) {
  console.log('✅ All routes clean — no horizontal overflow detected.')
} else {
  console.log(`❌ ${failures.length} issue(s) found:`)
  failures.forEach(f => console.log(`   ${f.vp}  ${f.route}  ${f.detail}`))
}
console.log(`Screenshots saved to: ${SHOT_DIR}`)
