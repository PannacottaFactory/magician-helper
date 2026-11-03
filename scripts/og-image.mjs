// Social preview image (1200×630) shown when the site link is shared.
// Uses the dashboard screenshot from public/landing (see scripts/screenshots.mjs).
// Usage: node scripts/og-image.mjs   (optional: CHROME_PATH)
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const shot = readFileSync(path.resolve('public/landing/dashboard-desktop.webp')).toString('base64')
const logo = readFileSync(path.resolve('public/favicon.svg')).toString('base64')

const html = `<!doctype html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0e0e0f; color: #ececea; font-family: Inter, sans-serif; position: relative; }
  .glow { position: absolute; width: 900px; height: 900px; left: -250px; top: -520px; border-radius: 50%; background: radial-gradient(closest-side, rgba(201,162,77,.20), transparent); }
  .text { position: absolute; left: 72px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; }
  .brand { display: flex; align-items: center; gap: 12px; font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 30px; letter-spacing: .02em; }
  .brand img { width: 40px; height: 40px; }
  .gold { color: #c9a24d; }
  h1 { margin-top: 44px; font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 92px; line-height: .95; letter-spacing: -.01em; }
  h1 em { font-weight: 500; background: linear-gradient(100deg, #a8812f, #c9a24d 45%, #ecd394); -webkit-background-clip: text; color: transparent; padding-right: 8px; }
  p { margin-top: 30px; font-size: 24px; line-height: 1.45; color: #a3a3a8; }
  .shot { position: absolute; left: 640px; top: 92px; width: 760px; border-radius: 14px; border: 1px solid rgba(255,255,255,.10); background: #121110; padding: 10px; box-shadow: 0 40px 80px rgba(0,0,0,.6); }
  .shot img { display: block; width: 100%; border-radius: 6px; }
  .line { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: linear-gradient(90deg, transparent, #c9a24d, transparent); opacity: .7; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="text">
    <div class="brand"><img src="data:image/svg+xml;base64,${logo}"> <span>Magician <span class="gold">Helper</span></span></div>
    <h1>Your magic,<br><em>organized.</em></h1>
    <p>Repertoire, routines, practice, gigs and props — for working magicians.</p>
  </div>
  <div class="shot"><img src="data:image/webp;base64,${shot}"></div>
  <div class="line"></div>
</body></html>`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630 })
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.resolve('public/og-image.jpg'), type: 'jpeg', quality: 88 })
await browser.close()
console.log('saved public/og-image.jpg')
