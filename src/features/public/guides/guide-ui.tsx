import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { guidePath } from './guides-meta'

/** Highlighted advice box inside an article. */
export function Tip({ title = 'Tip', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-8 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-sm leading-relaxed">
      <p className="mb-1.5 flex items-center gap-2 font-semibold text-gold">
        <Lightbulb className="size-4" aria-hidden="true" /> {title}
      </p>
      <div className="space-y-2">{children}</div>
    </aside>
  )
}

/** Simple data table that scrolls horizontally on small screens. */
export function GuideTable({ caption, head, rows, className }: { caption: string; head: string[]; rows: ReactNode[][]; className?: string }) {
  return (
    <div className={cn('not-prose my-8 overflow-x-auto rounded-2xl border bg-card', className)}>
      <table className="w-full text-left text-sm">
        <caption className="border-b px-4 py-3 text-left text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{caption}</caption>
        <thead>
          <tr className="border-b">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-muted-foreground first:text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Link to another guide. */
export function GuideLink({ slug, children }: { slug: string; children: ReactNode }) {
  return <Link to={guidePath(slug)}>{children}</Link>
}

/** Typography for article bodies. */
export const PROSE = cn(
  'text-[1.0625rem] leading-relaxed text-foreground/90',
  '[&>p]:mt-5 [&>ul]:mt-5 [&>ol]:mt-5',
  '[&_h2]:mt-14 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:font-semibold [&_h2]:text-foreground',
  '[&_h3]:mt-9 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground',
  '[&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal [&_li]:pl-1 [&_li]:marker:text-gold',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
  // links in the text only: buttons and boxes marked `not-prose` keep their own colors
  '[&_a:not(.not-prose_a)]:text-gold [&_a:not(.not-prose_a)]:underline [&_a:not(.not-prose_a)]:underline-offset-4 [&_a:not(.not-prose_a):hover]:text-foreground',
)
