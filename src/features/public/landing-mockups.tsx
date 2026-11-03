import { Check, Clock, Flame, PackageCheck, Sparkles, Star } from 'lucide-react'
import { CatalogIllustration } from '@/features/inventory/catalog/illustrations'
import { tagColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

// Illustrative mockups of the app, drawn in code with fictional content.
// They are decorative: hidden from screen readers (the surrounding text describes them).

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('overflow-hidden rounded-2xl border border-white/10 bg-[#121213] text-[#ececea] shadow-2xl shadow-black/40', className)}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
      </div>
      {children}
    </div>
  )
}

const chip = 'rounded-full border px-2 py-0.5 text-[10px] font-medium'

export function DashboardMockup() {
  const bars = [20, 35, 0, 45, 30, 60, 25]
  return (
    <Frame>
      <div className="grid gap-3 p-4 sm:grid-cols-[9rem_1fr]">
        <div className="hidden space-y-1.5 sm:block">
          {['Dashboard', 'Tricks', 'Routines', 'Practice', 'Gigs', 'Clients', 'Inventory', 'Ideas'].map((item, i) => (
            <div key={item} className={cn('rounded-md px-2.5 py-1.5 text-xs', i === 0 ? 'bg-white/10 text-white' : 'text-white/50')}>
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="font-display text-xl font-semibold">Good evening, Zoltan</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Revenue this month', '€2,450'],
              ['Pending payments', '€600'],
              ['Practice · 7 days', '3 h 35'],
              ['Next gig', 'in 2 days'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="text-base font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            <div className="rounded-lg border border-white/10 p-3">
              <p className="mb-2 text-xs font-semibold">Upcoming gigs</p>
              {[
                ['DEC', '14', 'Acme Christmas party', '7/9'],
                ['DEC', '21', 'Sophie & Tom’s wedding', '3/12'],
              ].map(([m, d, t, c]) => (
                <div key={t} className="mb-1.5 flex items-center gap-2 rounded-md border border-white/10 p-1.5">
                  <span className="flex w-8 flex-col items-center rounded bg-[#c9a24d]/15 py-0.5">
                    <span className="text-[8px] font-semibold">{m}</span>
                    <span className="font-display text-sm leading-none font-semibold text-[#c9a24d]">{d}</span>
                  </span>
                  <span className="flex-1 truncate text-[11px]">{t}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/50">
                    <PackageCheck className="size-3" /> {c}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="mb-2 flex items-center justify-between text-xs font-semibold">
                Practice <span className="inline-flex items-center gap-1 text-[10px] font-normal text-orange-300"><Flame className="size-3" /> 5-day streak</span>
              </p>
              <div className="flex h-16 items-end gap-1.5 border-b border-white/10">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-[3px] bg-[#c9a24d]" style={{ height: `${(h / 60) * 100}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

export function KanbanMockup() {
  const columns = [
    { title: 'Learning', dot: 'bg-sky-400', cards: [['Coin Matrix', ['Sleight-heavy']], ['Card Warp', ['Impromptu']]] },
    { title: 'Needs polish', dot: 'bg-amber-400', cards: [['Ambitious Card', ['Opener', 'Walkaround']]] },
    { title: 'Performance-ready', dot: 'bg-[#c9a24d]', cards: [['Sponge Balls', ['Family friendly']], ['Invisible Deck', ['Closer']]] },
  ] as const
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2 p-3">
        {columns.map((col) => (
          <div key={col.title} className="space-y-1.5 rounded-lg bg-white/[0.04] p-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold">
              <span className={cn('size-1.5 rounded-full', col.dot)} /> {col.title}
            </p>
            {col.cards.map(([name, tags]) => (
              <div key={name} className="space-y-1 rounded-md border border-white/10 bg-[#18181a] p-2">
                <p className="text-[11px] font-medium">{name}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((s) => (
                    <Star key={s} className={cn('size-2.5', s <= 2 ? 'fill-[#c9a24d] text-[#c9a24d]' : 'text-white/20')} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span key={t} className={cn(chip, tagColor(t))}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function ChecklistMockup() {
  const items = [
    ['bicycle-red', 'Bicycle Standard deck (red)', true, ''],
    ['sponge-balls', 'Sponge balls × 4', true, ''],
    ['thumb-tip', 'Thumb tip', false, ''],
    ['flash-paper', 'Flash paper × 5', false, 'Only 2 in stock'],
  ] as const
  return (
    <Frame>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[#c9a24d]" />
          </div>
          <span className="text-[10px] text-white/50">2/4 packed</span>
        </div>
        <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
          {items.map(([key, label, done, warn]) => (
            <li key={key} className="flex items-center gap-2 px-2.5 py-1.5">
              <span className={cn('flex size-3.5 items-center justify-center rounded-[3px] border', done ? 'border-[#c9a24d] bg-[#c9a24d] text-black' : 'border-white/30')}>
                {done && <Check className="size-2.5" />}
              </span>
              <CatalogIllustration catalogKey={key} className="h-6 w-8 shrink-0 overflow-hidden rounded" />
              <span className={cn('flex-1 truncate text-[11px]', done && 'text-white/40 line-through')}>{label}</span>
              {warn && <span className="rounded-full border border-red-400/40 bg-red-400/10 px-1.5 text-[9px] text-red-300">{warn}</span>}
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-[10px] text-white/50">
          <Clock className="size-3" /> 42 min of show · <Sparkles className="size-3 text-[#c9a24d]" /> 7 tricks ready
        </p>
      </div>
    </Frame>
  )
}
