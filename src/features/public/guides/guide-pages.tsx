import { Link, useParams } from 'react-router'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { PublicLayout } from '../public-layout'
import { NotFoundPage } from '../simple-pages'
import { GUIDE_BODIES } from './articles'
import { PROSE } from './guide-ui'
import { GUIDES, GUIDES_PATH, findGuide, guidePath, type GuideMeta } from './guides-meta'

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`))

function Breadcrumbs({ current }: { current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </li>
        <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
        <li>
          {current ? (
            <Link to={GUIDES_PATH} className="hover:text-foreground">Guides</Link>
          ) : (
            <span aria-current="page" className="text-foreground">Guides</span>
          )}
        </li>
        {current && (
          <>
            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
            <li aria-current="page" className="text-foreground">{current}</li>
          </>
        )}
      </ol>
    </nav>
  )
}

function GuideCard({ guide, headingLevel = 'h2' }: { guide: GuideMeta; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <Link
      to={guidePath(guide.slug)}
      className="group flex h-full flex-col rounded-2xl border bg-card p-6 transition-[translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <p className="text-xs font-semibold tracking-[0.25em] text-gold uppercase">{guide.category}</p>
      <Heading className="mt-3 font-display text-2xl leading-snug font-semibold text-balance">{guide.title}</Heading>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{guide.description}</p>
      <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
        Read the guide <span className="sr-only">: {guide.shortTitle}</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </p>
    </Link>
  )
}

export function GuidesIndexPage() {
  useDocumentTitle('Guides for magicians')
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Breadcrumbs />
        <header className="mt-8 max-w-3xl">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            Guides for <em className="text-gold-gradient pr-1 font-medium">working magicians</em>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Practical advice for the business and the craft: organizing your repertoire, a free trick list template,
            practicing, building setlists, pricing and invoicing your shows and preparing every gig.
          </p>
        </header>
        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <GuideCard guide={g} />
            </li>
          ))}
        </ul>
      </div>
    </PublicLayout>
  )
}

export function GuidePage({ slug }: { slug: string }) {
  const guide = findGuide(slug)
  useDocumentTitle(guide?.title)
  const Body = GUIDE_BODIES[slug]
  if (!guide || !Body) return <NotFoundPage />
  // the next three guides (wrapping around), so every guide gets linked as often
  const index = GUIDES.indexOf(guide)
  const related = [1, 2, 3].map((k) => GUIDES[(index + k) % GUIDES.length])

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Breadcrumbs current={guide.shortTitle} />
        <header className="mt-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">{guide.category}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{guide.description}</p>
          <p className="mt-5 text-sm text-muted-foreground">
            By the Magician Helper team · Updated <time dateTime={guide.updated}>{formatDate(guide.updated)}</time> ·{' '}
            {guide.readingMinutes} min read
          </p>
        </header>

        <div className={`mt-10 border-t pt-4 ${PROSE}`}>
          <Body />
        </div>

        <aside className="mt-16 rounded-3xl border border-gold/40 bg-gradient-to-b from-accent/60 to-card p-8 text-center sm:p-10">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Magician Helper</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-balance">{guide.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{guide.cta.text}</p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/signup">
              Try it free for 14 days <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required</p>
        </aside>
      </article>

      <section aria-labelledby="more-guides" className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="more-guides" className="font-display text-3xl font-semibold">More guides</h2>
            <Link to={GUIDES_PATH} className="text-sm text-gold underline underline-offset-4 hover:text-foreground">
              All guides
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {related.map((g) => (
              <li key={g.slug}>
                <GuideCard guide={g} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicLayout>
  )
}

/** Router entry: /guides/:slug */
export function GuideRoute() {
  const { slug = '' } = useParams()
  return <GuidePage key={slug} slug={slug} />
}
