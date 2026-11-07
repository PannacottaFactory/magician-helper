// Search engine metadata for the public pages. Used by the browser tab title and
// by scripts/prerender.mjs, which writes a real HTML file for each page at build
// time (Google then sees the text without running JavaScript).
import { GUIDES, GUIDES_PATH, findGuide, guidePath } from './guides/guides-meta'
import { FAQ } from './landing-content'

export const SITE_NAME = 'Magician Helper'
export const DEFAULT_TITLE = `${SITE_NAME} — The app for professional magicians`

/** Absolute URL of the public site, with a trailing slash (set by VITE_SITE_URL, see vite.config.ts). */
export const SITE_URL: string = String(import.meta.env.VITE_SITE_URL).replace(/\/?$/, '/')

export type PublicPageMeta = {
  /** Router path */
  path: string
  /** File written in dist/ (GitHub Pages serves privacy.html for /privacy, guides/index.html for /guides/) */
  file: string
  title: string
  description: string
  /** false = "noindex" and left out of the sitemap */
  indexable: boolean
}

export const PUBLIC_PAGES: PublicPageMeta[] = [
  {
    path: '/',
    file: 'index.html',
    title: DEFAULT_TITLE,
    description:
      'The all-in-one app for magicians: organize your repertoire, routines and practice, book gigs, manage clients and props, send quotes and invoices. Free 14-day trial.',
    indexable: true,
  },
  // The legal pages are still templates with [PLACEHOLDERS]: switch `indexable`
  // to true once they are completed.
  {
    path: '/privacy',
    file: 'privacy.html',
    title: `Privacy Policy · ${SITE_NAME}`,
    description: 'How Magician Helper collects, uses and protects your data.',
    indexable: false,
  },
  {
    path: '/terms',
    file: 'terms.html',
    title: `Terms of Service · ${SITE_NAME}`,
    description: 'The terms that govern your use of Magician Helper.',
    indexable: false,
  },
  {
    path: GUIDES_PATH,
    file: 'guides/index.html',
    title: `Guides for magicians · ${SITE_NAME}`,
    description:
      'Practical guides for working magicians: pricing and invoicing your shows, organizing your repertoire, practicing, building setlists and preparing every gig.',
    indexable: true,
  },
  ...GUIDES.map((g) => ({
    path: guidePath(g.slug),
    file: `${guidePath(g.slug).slice(1)}.html`,
    title: `${g.title} · ${SITE_NAME}`,
    description: g.description,
    indexable: true,
  })),
]

export function pageUrl(path: string): string {
  return SITE_URL + path.replace(/^\//, '')
}

const CURRENCIES: Record<string, string> = { '€': 'EUR', $: 'USD', '£': 'GBP', CHF: 'CHF', CAD: 'CAD' }

/** "€9.99/month" → { price: "9.99", currency: "EUR" } (null when it cannot be read). */
function parsePrice(label: string): { price: string; currency: string } | null {
  const amount = label.match(/\d+(?:[.,]\d{1,2})?/)?.[0]
  const symbol = Object.keys(CURRENCIES).find((s) => label.includes(s))
  if (!amount || !symbol) return null
  return { price: amount.replace(',', '.'), currency: CURRENCIES[symbol] }
}

const ORGANIZATION = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }

function breadcrumbs(items: [name: string, path: string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: pageUrl(path) })),
  }
}

/** schema.org data (JSON-LD) for a public page, or null when it has none. */
export function structuredData(path: string, priceLabel: string): object[] | null {
  if (path === '/') return landingStructuredData(priceLabel)
  if (path === GUIDES_PATH) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Guides for magicians',
        url: pageUrl(GUIDES_PATH),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: GUIDES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(guidePath(g.slug)), name: g.title })),
        },
      },
      breadcrumbs([['Home', '/'], ['Guides', GUIDES_PATH]]),
    ]
  }
  const guide = findGuide(path.slice(GUIDES_PATH.length))
  if (path.startsWith(GUIDES_PATH) && guide) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        image: `${SITE_URL}og-image.jpg`,
        datePublished: guide.published,
        dateModified: guide.updated,
        author: ORGANIZATION,
        publisher: { ...ORGANIZATION, logo: { '@type': 'ImageObject', url: `${SITE_URL}icons/icon-512.png` } },
        mainEntityOfPage: pageUrl(path),
        inLanguage: 'en',
      },
      breadcrumbs([['Home', '/'], ['Guides', GUIDES_PATH], [guide.shortTitle, path]]),
    ]
  }
  return null
}

/** schema.org data (JSON-LD) for the landing page. */
function landingStructuredData(priceLabel: string) {
  const price = parsePrice(priceLabel)
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}og-image.jpg`,
      description: PUBLIC_PAGES[0].description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      audience: { '@type': 'Audience', audienceType: 'Magicians, mentalists and illusionists' },
      featureList: [
        'Magic trick repertoire with hidden methods',
        'Routines and setlists',
        'Practice log with timer',
        'Gig calendar and client management',
        'Quotes and invoices (PDF)',
        'Show sheets (PDF)',
        'Calendar sync with Google Calendar, Apple Calendar and Outlook',
        'Props and gimmicks inventory',
        'Ideas notebook',
      ],
      ...(price && {
        offers: {
          '@type': 'Offer',
          price: price.price,
          priceCurrency: price.currency,
          description: '14-day free trial, then a monthly subscription. Cancel anytime.',
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]
}
