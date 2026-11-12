// Raster favicons generated from public/favicon.svg, for Google Search results and old browsers:
// public/favicon.ico (16, 32, 48 px, PNG-encoded) and public/favicon-96x96.png / favicon-192x192.png
// (Google wants a square icon whose size is a multiple of 48 px).
// Usage: node scripts/favicons.mjs   (optional: CHROME_PATH)
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const svg = readFileSync(path.resolve('public/favicon.svg')).toString('base64')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()

async function render(size) {
  await page.setViewport({ width: size, height: size })
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">
      <img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}" style="display:block">
    </body></html>`,
    { waitUntil: 'load' },
  )
  return Buffer.from(await page.screenshot({ type: 'png', omitBackground: true }))
}

const icoSizes = [16, 32, 48]
const icoImages = []
for (const size of icoSizes) icoImages.push(await render(size))
writeFileSync(path.resolve('public/favicon-96x96.png'), await render(96))
writeFileSync(path.resolve('public/favicon-192x192.png'), await render(192))
await browser.close()

// ICO container: 6-byte header, one 16-byte entry per image, then the PNG data.
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(icoImages.length, 4)
let offset = 6 + 16 * icoImages.length
const entries = icoImages.map((png, i) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(icoSizes[i], 0) // width
  entry.writeUInt8(icoSizes[i], 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += png.length
  return entry
})
writeFileSync(path.resolve('public/favicon.ico'), Buffer.concat([header, ...entries, ...icoImages]))
console.log('saved public/favicon.ico, public/favicon-96x96.png, public/favicon-192x192.png')
