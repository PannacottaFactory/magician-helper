import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  EyeOff,
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
import { ChecklistMockup, DashboardMockup, KanbanMockup } from './landing-mockups'
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

const FAQ = [
  {
    q: 'Do I need a credit card for the free trial?',
    a: 'No. Sign up with your email and get 14 days of full access. You only enter a card if you decide to subscribe.',
  },
  {
    q: 'What happens when the trial ends?',
    a: 'Nothing is deleted. Your account becomes read-only: you can still view and export everything. Subscribe at any time to create and edit again.',
  },
  {
    q: 'If I subscribe during the trial, do I lose my free days?',
    a: 'No. Your first payment is taken when your 14 days are over.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, in two clicks from the Billing page. You keep access until the end of the period you paid for.',
  },
  {
    q: 'Are my secrets safe?',
    a: 'Your data is private to your account — the database itself refuses any access from other users. Methods are hidden on screen until you tap “Reveal”, and everything travels over encrypted connections.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes. Magician Helper is designed mobile-first and can be installed on your home screen like an app (iPhone and Android).',
  },
  {
    q: 'Can I bring my existing repertoire?',
    a: 'Yes. Import your tricks from a CSV file (a spreadsheet export works). And you can export all your data, at any time, in JSON or CSV.',
  },
]

export function LandingPage() {
  useDocumentTitle()
  const price = env.priceLabel

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-64 left-1/2 size-[760px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
            <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-gold uppercase">For working magicians</p>
            <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Your magic, <span className="text-gold">organized.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Repertoire, routines, practice, gigs and props — in one elegant place. Spend less time on admin and more
              time on the craft.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-title" className="font-display text-4xl font-semibold">Everything backstage, handled</h2>
            <p className="mt-3 text-muted-foreground">Built with magicians, for the way you actually work.</p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, tone }) => (
              <li key={title} className="rounded-2xl border bg-card p-6 transition-colors hover:border-gold/40">
                <span className={`mb-4 flex size-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Showcase */}
      <section aria-labelledby="showcase-title" className="border-t">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 id="showcase-title" className="font-display text-4xl font-semibold">See your progress at a glance</h2>
            <p className="mt-3 text-muted-foreground">
              Move tricks from <em>learning</em> to <em>performance-ready</em> with a simple drag. Colors, stars and
              tags make your whole repertoire readable in seconds.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {['Table, cards or kanban views', 'Filters by status, category and tag', 'Secrets hidden until you reveal them'].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <KanbanMockup />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2 className="font-display text-4xl font-semibold">Pack the right props, every time</h2>
            <p className="mt-3 text-muted-foreground">
              Link routines to a gig and Magician Helper builds the checklist for you — with a warning if something is
              out of stock.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {['Generated from your routines', 'Stock alerts before the show', 'Add your own items (mic, table…)'].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <ChecklistMockup />
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="how-title" className="text-center font-display text-4xl font-semibold">Up and running in minutes</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ['Add your tricks and props', 'Type them in, import a CSV, or pick classic props from the catalog.'],
              ['Build routines and practice', 'Order your setlists and log rehearsals with the timer.'],
              ['Book gigs and get paid', 'Track fees and deposits, and pack with the auto-generated checklist.'],
            ].map(([title, text], i) => (
              <li key={title} className="rounded-2xl border bg-card p-6">
                <span className="mb-4 flex size-9 items-center justify-center rounded-full border border-gold/50 font-display text-lg font-semibold text-gold">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Smartphone className="size-4 text-gold" aria-hidden="true" /> Install on your phone</span>
            <span className="inline-flex items-center gap-2"><EyeOff className="size-4 text-gold" aria-hidden="true" /> Private by design</span>
            <span className="inline-flex items-center gap-2"><Download className="size-4 text-gold" aria-hidden="true" /> Export anytime</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="pricing-title" className="text-center font-display text-4xl font-semibold">One plan. Everything included.</h2>
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-gold/40 bg-gradient-to-b from-accent/60 to-card p-8 text-center shadow-xl shadow-black/10">
            <p className="text-sm font-semibold tracking-wider text-gold uppercase">14-day free trial</p>
            <p className="mt-4">
              <span className="font-display text-6xl font-semibold">{price.split('/')[0]}</span>
              <span className="text-muted-foreground"> / month</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">after your free trial · cancel anytime</p>
            <ul className="mt-6 space-y-2 text-left text-sm">
              {[
                'Unlimited tricks, routines, ideas and props',
                'Practice timer, streaks and history',
                'Gigs, calendar, clients and payments',
                'Automatic preparation checklists',
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
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-center font-display text-4xl font-semibold">Questions, answered</h2>
          <div className="mt-10 divide-y rounded-2xl border bg-card">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-semibold">Ready for your next show?</h2>
          <p className="mt-3 text-muted-foreground">Set up your repertoire tonight. It's free for 14 days.</p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/signup">
              Start your free trial <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}
