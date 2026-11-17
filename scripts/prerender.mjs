// Prerenders the public pages (landing, legal) into real HTML files after `vite build`,
// so search engines get the full text, a canonical URL and structured data without
// running JavaScript. Also writes sitemap.xml, robots.txt and llms.txt.
//
// Run by `npm run build`, after scripts/spa-fallback.mjs (404.html must stay an empty
// app shell: it serves /app/… and other deep links).
// Optional env: VITE_GOOGLE_SITE_VERIFICATION (Google Search Console "HTML tag" code).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, loadEnv } from 'vite'

const DIST = path.resolve('dist')
const OUT = path.resolve('node_modules/.tmp/prerender')

// 1. Server build of src/prerender-entry.tsx
await build({
  logLevel: 'warn',
  mode: 'production',
  build: { ssr: 'src/prerender-entry.tsx', outDir: OUT, emptyOutDir: true, copyPublicDir: false },
})
const entry = await import(pathToFileURL(path.join(OUT, 'prerender-entry.js')).href)
const { PUBLIC_PAGES, SITE_URL, basePath, pageUrl, priceLabel, render, structuredData } = entry

const env = loadEnv('production', process.cwd(), '')
const verification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim()

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

function replaceTag(html, regex, tag) {
  if (!regex.test(html)) throw new Error(`prerender: tag not found in index.html: ${regex}`)
  return html.replace(regex, tag)
}

// 2. One HTML file per public page, built from the app shell
const template = readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('prerender: dist/index.html was already prerendered')

for (const page of PUBLIC_PAGES) {
  const url = pageUrl(page.path)
  // URLs on which this file may be served. Anywhere else (the service worker serves
  // index.html for every /app/… page) the static copy is hidden until React renders.
  const own = basePath + page.path.replace(/^\//, '')
  const ownPaths = [own.replace(/\/+$/, ''), basePath + page.file]

  let html = template
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${attr(page.title)}</title>`)
  html = replaceTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${attr(page.description)}" />`)
  html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${attr(url)}" />`)
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${attr(url)}" />`)
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${attr(page.title)}" />`)
  if (page.path !== '/') {
    html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attr(page.description)}" />`)
  }

  const ld = structuredData(page.path, priceLabel)
  if (ld?.some((d) => d['@type'] === 'Article')) {
    html = replaceTag(html, /<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="article" />')
  }
  const head = [
    `<meta name="robots" content="${page.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />`,
    verification && page.path === '/' ? `<meta name="google-site-verification" content="${attr(verification)}" />` : '',
    ld ? `<script type="application/ld+json">${jsonLd(ld)}</script>` : '',
    `<style>.mh-shell [data-prerendered]{display:none}</style>`,
    `<script>(function(){var p=location.pathname.replace(/\\/+$/,'');if(${JSON.stringify(ownPaths)}.indexOf(p)<0)document.documentElement.classList.add('mh-shell')})()</script>`,
  ].filter(Boolean)
  html = html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root"><div data-prerendered>${render(page.path)}</div></div>`)

  mkdirSync(path.dirname(path.join(DIST, page.file)), { recursive: true })
  writeFileSync(path.join(DIST, page.file), html)
  console.log(`prerender: dist/${page.file} (${page.path})`)
}

// 3. sitemap.xml and robots.txt
// Note: Google only reads robots.txt at the root of a domain (fine with magicianhelper.com).
const today = new Date().toISOString().slice(0, 10)
const urls = PUBLIC_PAGES.filter((p) => p.indexable)
  .map((p) => `  <url>\n    <loc>${pageUrl(p.path)}</loc>\n    <lastmod>${p.updated ?? today}</lastmod>\n  </url>`)
  .join('\n')
writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)
writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${basePath}app/\n\nSitemap: ${SITE_URL}sitemap.xml\n`)

// llms.txt (llmstxt.org): a plain summary of the site for AI search assistants
const indexable = PUBLIC_PAGES.filter((p) => p.indexable)
const isGuide = (p) => p.path.startsWith('/guides/') && p.path !== '/guides/'
const link = (p) => `- [${p.title.replace(/ · Magician Helper$/, '')}](${pageUrl(p.path)}): ${p.description}`
writeFileSync(
  path.join(DIST, 'llms.txt'),
  [
    '# Magician Helper',
    '',
    `> ${indexable[0].description}`,
    '',
    'Magician Helper (also searched as "Magic Helper") is a web app for magicians, mentalists and illusionists, installable on iPhone and Android. It covers: a magic trick organizer (repertoire database with effects, hidden methods, status, categories, tags, props, durations, videos, CSV import), routines and setlists with total running time, a practice log with timer and streaks, a gig calendar with clients, fees and deposits, automatic prop packing checklists, numbered quotes and invoices in PDF, show sheets, calendar sync (Google, Apple, Outlook), a props and gimmicks inventory and an ideas notebook. Data is private to each account; full export in JSON or CSV.',
    '',
    `Pricing: 14-day free trial without a credit card, then ${priceLabel}. Sign up: ${pageUrl('/signup')}`,
    '',
    '## Pages',
    '',
    ...indexable.filter((p) => !isGuide(p)).map(link),
    '',
    '## Guides',
    '',
    ...indexable.filter(isGuide).map(link),
    '',
  ].join('\n'),
)
console.log('prerender: dist/sitemap.xml, dist/robots.txt, dist/llms.txt')

rmSync(OUT, { recursive: true, force: true })
// the Supabase client created at import time may keep the process alive
process.exit(0)
