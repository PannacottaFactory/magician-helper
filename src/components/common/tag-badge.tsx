import { AUDIENCE_COLORS, CATEGORY_COLORS, tagColor } from '@/lib/colors'
import { AUDIENCE_TYPES, TRICK_CATEGORIES, labelOf } from '@/lib/constants'
import { cn } from '@/lib/utils'

const base = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap'

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  return <span className={cn(base, tagColor(tag), className)}>{tag}</span>
}

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <span className={cn(base, CATEGORY_COLORS[category] ?? tagColor(category), className)}>
      {labelOf(TRICK_CATEGORIES, category)}
    </span>
  )
}

export function AudienceBadge({ audience, className }: { audience: string; className?: string }) {
  return (
    <span className={cn(base, AUDIENCE_COLORS[audience] ?? tagColor(audience), className)}>
      {labelOf(AUDIENCE_TYPES, audience)}
    </span>
  )
}

/** Shows the first `max` tags then "+N". */
export function TagList({ tags, max = 99, className }: { tags: string[]; max?: number; className?: string }) {
  if (!tags.length) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags.slice(0, max).map((t) => (
        <TagBadge key={t} tag={t} />
      ))}
      {tags.length > max && <span className="text-xs text-muted-foreground">+{tags.length - max}</span>}
    </div>
  )
}
