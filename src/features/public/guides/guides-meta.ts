// Metadata of the public guides (SEO articles). Kept free of React imports: also
// used by seo.ts for the page titles, the sitemap and the structured data.
// A new guide = an entry here + its body in articles/ (registered in articles/index.ts).

export type GuideMeta = {
  slug: string
  /** H1 and <title> */
  title: string
  /** Short label for cards and breadcrumbs */
  shortTitle: string
  /** Meta description and lead paragraph (~150 characters) */
  description: string
  category: string
  /** ISO dates */
  published: string
  updated: string
  readingMinutes: number
  /** Call to action at the end of the article */
  cta: { title: string; text: string }
}

export const GUIDES_PATH = '/guides/'

export function guidePath(slug: string): string {
  return `${GUIDES_PATH}${slug}`
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'how-to-invoice-a-magic-show',
    title: 'How to Invoice a Magic Show: What to Include, With an Example',
    shortTitle: 'Invoicing a magic show',
    description:
      'Everything a magician’s invoice needs — numbering, deposit, balance, tax mentions and payment terms — with a worked example and the mistakes that delay payment.',
    category: 'Business',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 7,
    cta: {
      title: 'Numbered invoices in two clicks',
      text: 'Magician Helper turns a gig into a quote, then an invoice, with automatic numbering, your business details, deposit and balance, as a clean PDF.',
    },
  },
  {
    slug: 'how-much-to-charge-for-a-magic-show',
    title: 'How Much to Charge for a Magic Show: A Pricing Method for Magicians',
    shortTitle: 'Pricing your magic shows',
    description:
      'A step-by-step method to set your magic show prices: your minimum fee, the real hours behind a set, market rates, packages, and how to write a quote that gets accepted.',
    category: 'Business',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 8,
    cta: {
      title: 'Quotes that look as good as your act',
      text: 'Send numbered quotes with your packages and deposit, see which ones are accepted, and track every fee and payment from one dashboard.',
    },
  },
  {
    slug: 'organize-your-magic-repertoire',
    title: 'How to Organize Your Magic Repertoire (and Never Forget a Trick)',
    shortTitle: 'Organizing your repertoire',
    description:
      'What to record for every trick, how to track what is performance-ready, which tags actually help, and how to keep your methods private — a system for working magicians.',
    category: 'Repertoire',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 7,
    cta: {
      title: 'Your whole repertoire, in one place',
      text: 'Effects, hidden methods, status, duration, props, sources and video references — in a table, cards or a kanban board, on your phone and your computer.',
    },
  },
  {
    slug: 'how-to-practice-magic',
    title: 'How to Practice Magic: A Practice Routine That Actually Sticks',
    shortTitle: 'Practicing magic',
    description:
      'Practice versus rehearsal, how to structure a session, camera or mirror, what to write in a practice log, and how to keep your whole repertoire sharp.',
    category: 'Practice',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 7,
    cta: {
      title: 'Practice with a timer and a log',
      text: 'Start the timer, note the flaws to fix and rate the session. Magician Helper keeps your streak and shows which tricks have gone cold.',
    },
  },
  {
    slug: 'magic-show-checklist',
    title: 'The Magician’s Gig Checklist: Before, During and After the Show',
    shortTitle: 'Gig checklist',
    description:
      'A complete checklist for magicians: questions to ask when booking, what to confirm the week before, what to pack, what to do on the day and the follow-up that brings referrals.',
    category: 'Gigs',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 6,
    cta: {
      title: 'A packing list built from your routines',
      text: 'Link routines to a gig and Magician Helper lists every prop to pack, warns you about low stock and prints a show sheet with the venue, contact and running order.',
    },
  },
  {
    slug: 'how-to-build-a-magic-setlist',
    title: 'How to Build a Magic Setlist That Flows, From Opener to Closer',
    shortTitle: 'Building a setlist',
    description:
      'How to choose an opener and a closer, vary your effects, plan transitions and resets, and adapt a magic setlist to walk-around, parlour, stage or children’s shows.',
    category: 'Routines',
    published: '2026-11-07',
    updated: '2026-11-07',
    readingMinutes: 7,
    cta: {
      title: 'Setlists that add up for you',
      text: 'Drag tricks into a routine with patter and transition notes. Magician Helper totals the running time and lists every prop you need.',
    },
  },
]

export function findGuide(slug: string | undefined): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
