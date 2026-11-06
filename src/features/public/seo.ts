// Search engine metadata for the public pages. Used by the browser tab title and
// by scripts/prerender.mjs, which writes a real HTML file for each page at build
// time (Google then sees the text without running JavaScript).
import { FAQ } from './landing-content'

export const SITE_NAME = 'Magician Helper'
export const DEFAULT_TITLE = `${SITE_NAME} — The app for professional magicians`

/** Absolute URL of the public site, with a trailing slash (set by VITE_SITE_URL, see vite.config.ts). */
export const SITE_URL: string = String(import.meta.env.VITE_SITE_URL).replace(/\/?$/, '/')

export type PublicPageMeta = {
  /** Router path */
  path: string
  /** File written in dist/ (GitHub Pages serves privacy.html for /privacy) */
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

/** schema.org data (JSON-LD) for the landing page. */
export function landingStructuredData(priceLabel: string) {
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
