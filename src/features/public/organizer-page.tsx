// SEO product page for the repertoire feature ("magic trick organizer", "catalog
// magic tricks", "magic trick database"). Prerendered like the landing page.
import { Link } from 'react-router'
import { ArrowRight, ChevronDown, Clock, EyeOff, FileUp, Film, KanbanSquare, Package, StickyNote, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { GuideTable } from './guides/guide-ui'
import { guidePath } from './guides/guides-meta'
import { CheckList, Eyebrow, SectionTitle } from './landing-page'
import { ORGANIZER_FAQ } from './landing-content'
import { LaptopFrame, PhoneFrame, Reveal } from './landing-visuals'
import { PublicLayout } from './public-layout'

const FIELDS = [
  { icon: StickyNote, title: 'Effect and patter', text: 'What the audience sees, in a sentence or two, plus your script and the lines that get the laughs.' },
  { icon: EyeOff, title: 'Method, kept secret', text: 'Secret and setup are hidden on screen until you tap Reveal — safe to open in front of spectators.' },
  { icon: KanbanSquare, title: 'Status', text: 'To learn, learning, needs polish, performance-ready. Only ready tricks end up in your setlists.' },
  { icon: Tags, title: 'Categories and tags', text: 'Cards, coins, mentalism, close-up, stage — and your own tags: opener, closer, no table, kids-friendly.' },
  { icon: Clock, title: 'Duration and difficulty', text: 'How long it plays and how hard it is, so routines total their running time automatically.' },
  { icon: Package, title: 'Props and gimmicks', text: 'Link the props from your inventory: every gig gets a packing list built from its tricks.' },
  { icon: Film, title: 'Videos and credits', text: 'Links to your performance videos and the book, DVD or creator you learned it from.' },
  { icon: FileUp, title: 'CSV import', text: 'Already have a spreadsheet? Import it in one go — columns are recognized automatically.' },
]

const yes = 'Yes'
const no = '—'

export function OrganizerPage() {
  useDocumentTitle('Magic Trick Organizer')
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-72 left-1/2 size-[820px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pt-24">
          <div>
            <Eyebrow>Magic trick organizer</Eyebrow>
            <h1 className="font-display text-5xl leading-[1] font-semibold tracking-tight text-balance sm:text-6xl">
              Catalog every trick <em className="text-gold-gradient pr-2 font-medium">you know.</em>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Magician Helper is a magic trick organizer built for performers: one private database for your whole
              repertoire, with effects, hidden methods, status, props and videos — on your phone and your computer.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start your 14-day free trial <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={guidePath('magic-trick-list-template')}>Free trick list template</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required</p>
          </div>
          <div className="relative">
            <LaptopFrame
              eager
              src="tricks-kanban-desktop.webp"
              alt="A magic repertoire organized in a kanban board: to learn, learning, needs polish and performance-ready."
            />
          </div>
        </div>
      </section>

      {/* What you record */}
      <section aria-labelledby="fields-title" className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow center>Your repertoire</Eyebrow>
            <SectionTitle id="fields-title">
              Everything a trick needs, <em className="text-gold-gradient pr-1 font-medium">in one record</em>
            </SectionTitle>
            <p className="mt-5 text-muted-foreground">
              The same short structure for every effect, so you can find, compare and perform them — not just store them.
            </p>
          </Reveal>
          <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={(i % 4) * 80}>
                <div className="h-full rounded-2xl border bg-card p-6">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Views and setlists */}
      <section aria-labelledby="views-title" className="overflow-hidden border-t">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Find it in seconds</Eyebrow>
            <SectionTitle id="views-title">
              A trick database <em className="text-gold-gradient pr-1 font-medium">you will actually use</em>
            </SectionTitle>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              A client wants twenty minutes, standing, no table, family audience? Filter your repertoire and drag the
              right tricks into a routine. Magician Helper totals the running time and lists every prop to pack.
            </p>
            <CheckList
              items={[
                'Table, cards or kanban views',
                'Search and filters by status, category and tag',
                'Routines and setlists built from your tricks',
                'Practice log that shows which tricks have gone cold',
              ]}
            />
          </Reveal>
          <Reveal delay={150} className="relative flex justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-1/2 rounded-full bg-gold/10 blur-3xl" />
            <PhoneFrame
              src="routine-mobile.webp"
              alt="A magic routine on a phone: five tricks in order with the total duration and props needed."
              className="relative w-60 sm:w-64"
            />
          </Reveal>
        </div>
      </section>

      {/* Comparison */}
      <section aria-labelledby="compare-title" className="border-t bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
          <Reveal className="text-center">
            <Eyebrow center>Compared</Eyebrow>
            <SectionTitle id="compare-title">
              Notes app, spreadsheet <em className="text-gold-gradient pr-1 font-medium">or organizer?</em>
            </SectionTitle>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
              Most magicians start with notes or a spreadsheet. Both work — until you have fifty tricks, a gig on
              Saturday and a method you do not want a spectator to read over your shoulder.
            </p>
          </Reveal>
          <GuideTable
            caption="Ways to catalog magic tricks"
            head={['', 'Notes app', 'Spreadsheet', 'Magician Helper']}
            rows={[
              ['Same fields for every trick', no, yes, yes],
              ['Filter by status, category, tag', no, 'Manual', yes],
              ['Methods hidden on screen', no, no, yes],
              ['Setlists with total running time', no, 'Formulas', yes],
              ['Props linked to tricks and gigs', no, no, yes],
              ['Practice log and streaks', no, no, yes],
              ['Comfortable on a phone', yes, no, yes],
              ['Export your data', 'Partly', yes, 'JSON or CSV'],
            ]}
          />
          <p className="text-center text-sm text-muted-foreground">
            Want to start with a spreadsheet anyway? Grab the{' '}
            <Link to={guidePath('magic-trick-list-template')} className="text-gold underline underline-offset-4 hover:text-foreground">
              free magic trick list template
            </Link>{' '}
            — it imports straight into Magician Helper later.
          </p>
        </div>
      </section>

      {/* Related guides */}
      <section aria-labelledby="learn-title" className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
          <SectionTitle id="learn-title" className="text-center">
            Learn the <em className="text-gold-gradient pr-1 font-medium">system</em>
          </SectionTitle>
          <ul className="mt-10 divide-y border-y">
            {[
              ['organize-your-magic-repertoire', 'How to organize your magic repertoire (and never forget a trick)'],
              ['magic-trick-list-template', 'Free magic trick list template (spreadsheet and CSV)'],
              ['how-to-build-a-magic-setlist', 'How to build a magic setlist that flows, from opener to closer'],
              ['how-to-practice-magic', 'How to practice magic: a practice routine that actually sticks'],
            ].map(([slug, title]) => (
              <li key={slug}>
                <Link
                  to={guidePath(slug)}
                  className="group flex items-center justify-between gap-4 py-4 font-display text-xl font-semibold hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {title}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-gold" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="organizer-faq" className="border-t bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <SectionTitle id="organizer-faq" className="text-center">
            Questions, <em className="text-gold-gradient pr-1 font-medium">answered</em>
          </SectionTitle>
          <div className="mt-12 divide-y rounded-2xl border bg-card">
            {ORGANIZER_FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
          <SectionTitle>
            Your repertoire, <em className="text-gold-gradient pr-1 font-medium">tonight.</em>
          </SectionTitle>
          <p className="mt-5 text-muted-foreground">Add your first tricks in minutes. Free for 14 days, no card needed.</p>
          <Button asChild size="lg" className="mt-10">
            <Link to="/signup">
              Start your free trial <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}
