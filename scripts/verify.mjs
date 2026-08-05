// Playwright smoke test: screenshots desktop + mobile, fails on console/page errors.
// Run with the preview server up:  node scripts/verify.mjs   (override URL via SHOOT_URL)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = process.env.SHOOT_URL || 'http://localhost:4317/'
const OUT = 'verify-shots'
mkdirSync(OUT, { recursive: true })

const errors = []
const browser = await chromium.launch()

async function shoot(label, viewport, full = true) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  // scroll through to trigger reveal/IntersectionObserver, then back to top
  await page.evaluate(async () => {
    const step = innerHeight * 0.8
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      scrollTo(0, y); await new Promise((r) => setTimeout(r, 120))
    }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: full })
  await page.close()
}

await shoot('desktop', { width: 1440, height: 900 })
await shoot('mobile', { width: 390, height: 844 })

await browser.close()

if (errors.length) {
  console.error('❌ errors:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('✅ verify OK — no console/page errors. Shots in ' + OUT + '/')
