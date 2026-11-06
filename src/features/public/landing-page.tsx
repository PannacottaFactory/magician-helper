import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  CalendarSync,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  EyeOff,
  FileText,
  Lightbulb,
  ListOrdered,
  Package,
  Smartphone,
  Sparkles,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'
import { FAQ, PERFORMERS } from './landing-content'
import { LaptopFrame, PhoneFrame, Reveal } from './landing-visuals'
import { PublicLayout } from './public-layout'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Your repertoire, finally in one place',
    text: 'Effects, secrets hidden until you reveal them, difficulty, duration, props and video references. Table, cards or kanban.',
    tone: 'bg-gold/15 text-gold',
  },
  {
    icon: ListOrdered,
    title: 'Routines that add up',
    text: 'Drag tricks into setlists with patter and transition notes. Total time, average difficulty and every prop you need, automatically.',
    tone: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  },
  {
    icon: Timer,
    title: 'Practice with purpose',
    text: 'A built-in timer, flaws to fix, self-ratings and a streak that keeps you honest. See which tricks have gone cold.',
    tone: 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
  },
  {
    icon: CalendarDays,
    title: 'Gigs without the chaos',
    text: 'Calendar, clients, fees, deposits and payment status. Every gig gets a packing checklist generated from its routines.',
    tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  {
    icon: FileText,
    title: 'Quotes and invoices in a click',
    text: 'Numbered quotes and invoices with your business details, tax and deposit, as clean PDFs. Know at a glance what is sent, accepted and paid.',
    tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  },
  {
    icon: ClipboardList,
    title: 'A show sheet for every gig',
    text: 'Venue, contact, show time, running order and packing list on one printable page — for you and the organizer.',
    tone: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  {
    icon: CalendarSync,
    title: 'Your gigs in your calendar',
    text: 'Subscribe from Google Calendar, Apple Calendar or Outlook and every booking shows up next to the rest of your life.',
    tone: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  },
  {
    icon: Package,
    title: 'Never run out of flash paper',
    text: 'Track props and gimmicks with photos, files and stock alerts. Start from a catalog of classic props in one click.',
    tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  {
    icon: Lightbulb,
    title: 'Catch every idea',
    text: 'A notebook for plots, presentations and patter lines — and a button that turns the good ones into tricks.',
    tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
]

/** Small spaced-out label above a section title, with a gold hairline. */
function Eyebrow({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={cn('mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-deep uppercase dark:text-gold', center && 'justify-center')}>
      <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
      {children}
      {center && <span aria-hidden="true" className="h-px w-8 bg-gold/60" />}
    </p>
  )
}

function SectionTitle({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn('font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl', className)}>
      {children}
    </h2>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 space-y-3 text-sm">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" /> {t}
        </li>
      ))}
    </ul>
  )
}

export function LandingPage() {
  useDocumentTitle()
  const price = env.priceLabel

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-72 left-1/2 size-[820px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pt-24 lg:pb-32">
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
            <Eyebrow>For working magicians</Eyebrow>
            <h1 className="font-display text-6xl leading-[0.95] font-semibold tracking-tight sm:text-7xl lg:text-[5.5rem]">
              Your magic,
              <br />
              <em className="text-gold-gradient pr-2 font-medium">organized.</em>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              The all-in-one app for professional magicians. Repertoire, routines, practice, gigs, clients, props and
              invoices — in one elegant place. Spend less time on admin and more time on the craft.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start your 14-day free trial <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See what's inside</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required · then {price}</p>
          </div>

          <div className="relative animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">
            <LaptopFrame
              eager
              src="dashboard-desktop.webp"
              alt="The Magician Helper dashboard: revenue this month, pending payments, practice time, upcoming gigs and stock alerts."
            />
            <PhoneFrame
              eager
              src="routine-mobile.webp"
              alt="A routine on a phone: five tricks in order, total duration and props needed."
              className="absolute right-0 -bottom-14 w-[27%] sm:-right-2"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow center>Features</Eyebrow>
            <SectionTitle id="features-title">
              Everything backstage, <em className="text-gold-gradient pr-1 font-medium">handled</em>
            </SectionTitle>
            <p className="mt-5 text-muted-foreground">
              Built with magicians, for the way you actually work — from the first practice session to the final invoice.
            </p>
          </Reveal>
          <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, tone }, i) => (
              <Reveal as="li" key={title} delay={(i % 3) * 90}>
                <div className="h-full rounded-2xl border bg-card p-7 transition-[translate,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-black/20">
                  <span className={`mb-5 flex size-10 items-center justify-center rounded-xl ${tone}`}>
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

      {/* Showcase */}
      <section aria-labelledby="showcase-title" className="overflow-hidden border-t">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow>Repertoire</Eyebrow>
            <SectionTitle id="showcase-title">
              See your progress <em className="text-gold-gradient pr-1 font-medium">at a glance</em>
            </SectionTitle>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Move tricks from <em>learning</em> to <em>performance-ready</em> with a simple drag. Colors, stars and
              tags make your whole repertoire readable in seconds.
            </p>
            <CheckList items={['Table, cards or kanban views', 'Filters by status, category and tag', 'Secrets hidden until you reveal them']} />
          </Reveal>
          <Reveal delay={150}>
            <LaptopFrame
              src="tricks-kanban-desktop.webp"
              alt="Tricks in a kanban board with four columns: to learn, learning, needs polish and performance-ready."
            />
          </Reveal>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 pb-24 sm:px-6 sm:pb-32 lg:grid-cols-2">
          <Reveal className="lg:order-2">
            <Eyebrow>Gigs</Eyebrow>
            <SectionTitle>
              Pack the right props, <em className="text-gold-gradient pr-1 font-medium">every time</em>
            </SectionTitle>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Link routines to a gig and Magician Helper builds the checklist for you — with a warning if something is
              out of stock.
            </p>
            <CheckList items={['Generated from your routines', 'Stock alerts before the show', 'Add your own items (mic, table…)']} />
          </Reveal>
          <Reveal delay={150} className="relative flex justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-1/2 rounded-full bg-gold/10 blur-3xl" />
            <PhoneFrame
              src="gig-checklist-mobile.webp"
              alt="A gig on a phone: its routine, a preparation checklist with three of seven props packed and a stock warning."
              className="relative w-60 sm:w-64"
            />
          </Reveal>
        </div>
      </section>

      {/* Who it's for */}
      <section aria-labelledby="performers-title" className="border-t">
        <Reveal className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-28">
          <Eyebrow center>Made for</Eyebrow>
          <SectionTitle id="performers-title">
            Every kind of <em className="text-gold-gradient pr-1 font-medium">performer</em>
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            Whether you work the tables at weddings, headline corporate events, read minds on stage or bring wonder to
            kids’ birthday parties, Magician Helper adapts to the way you perform.
          </p>
          <ul className="mt-10 flex flex-wrap justify-center gap-2.5">
            {PERFORMERS.map((p) => (
              <li key={p} className="rounded-full border border-gold/30 bg-card px-4 py-1.5 text-sm">
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="text-center">
            <Eyebrow center>How it works</Eyebrow>
            <SectionTitle id="how-title">
              Up and running <em className="text-gold-gradient pr-1 font-medium">in minutes</em>
            </SectionTitle>
          </Reveal>
          <ol className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Add your tricks and props', 'Type them in, import a CSV, or pick classic props from the catalog.'],
              ['Build routines and practice', 'Order your setlists and log rehearsals with the timer.'],
              ['Book gigs and get paid', 'Send quotes and invoices, track deposits, and pack with the auto-generated checklist.'],
            ].map(([title, text], i) => (
              <Reveal as="li" key={title} delay={i * 110} className="rounded-2xl border bg-card p-7">
                <span className="mb-5 block font-display text-5xl leading-none font-medium text-gold italic" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-semibold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Reveal>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Smartphone className="size-4 text-gold" aria-hidden="true" /> Install on your phone</span>
            <span className="inline-flex items-center gap-2"><EyeOff className="size-4 text-gold" aria-hidden="true" /> Private by design</span>
            <span className="inline-flex items-center gap-2"><Download className="size-4 text-gold" aria-hidden="true" /> Export anytime</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="text-center">
            <Eyebrow center>Pricing</Eyebrow>
            <SectionTitle id="pricing-title">
              One plan. <em className="text-gold-gradient pr-1 font-medium">Everything included.</em>
            </SectionTitle>
          </Reveal>
          <Reveal delay={120} className="mx-auto mt-14 max-w-md rounded-3xl border border-gold/40 bg-gradient-to-b from-accent/60 to-card p-8 text-center shadow-xl shadow-black/10 sm:p-10">
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">14-day free trial</p>
            <p className="mt-5">
              <span className="font-display text-7xl font-semibold tracking-tight">{price.split('/')[0]}</span>
              <span className="text-muted-foreground"> / month</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">after your free trial · cancel anytime</p>
            <ul className="mt-8 space-y-2.5 text-left text-sm">
              {[
                'Unlimited tricks, routines, ideas and props',
                'Practice timer, streaks and history',
                'Gigs, calendar, clients and payments',
                'Automatic preparation checklists',
                'Quotes, invoices and show sheets in PDF',
                'Calendar sync (Google, Apple, Outlook)',
                'Photos and files for your props',
                'CSV import and full data export',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 w-full">
              <Link to="/signup">Start free — no card needed</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="text-center">
            <Eyebrow center>FAQ</Eyebrow>
            <SectionTitle id="faq-title">
              Questions, <em className="text-gold-gradient pr-1 font-medium">answered</em>
            </SectionTitle>
          </Reveal>
          <Reveal delay={100} className="mt-12 divide-y rounded-2xl border bg-card">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <Reveal className="relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-6 sm:py-36">
          <SectionTitle className="sm:text-6xl">
            Ready for your <em className="text-gold-gradient pr-1 font-medium">next show?</em>
          </SectionTitle>
          <p className="mt-5 text-muted-foreground">Set up your repertoire tonight. It's free for 14 days.</p>
          <Button asChild size="lg" className="mt-10">
            <Link to="/signup">
              Start your free trial <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </section>
    </PublicLayout>
  )
}
