// Enum-like values stored in the database (snake_case) with their English labels.

export const TRICK_CATEGORIES = [
  { value: 'card', label: 'Card' },
  { value: 'coin', label: 'Coin' },
  { value: 'mentalism', label: 'Mentalism' },
  { value: 'stage', label: 'Stage' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'other', label: 'Other' },
] as const
export type TrickCategory = (typeof TRICK_CATEGORIES)[number]['value']

export const TRICK_STATUSES = [
  { value: 'to_learn', label: 'To learn', dot: 'bg-muted-foreground', badge: 'border-border text-muted-foreground' },
  { value: 'learning', label: 'Learning', dot: 'bg-sky-400', badge: 'border-sky-500/40 text-sky-600 dark:text-sky-300' },
  {
    value: 'needs_polish',
    label: 'Needs polish',
    dot: 'bg-warning',
    badge: 'border-warning/50 text-warning',
  },
  {
    value: 'performance_ready',
    label: 'Performance-ready',
    dot: 'bg-gold',
    badge: 'border-gold/50 text-gold',
  },
] as const
export type TrickStatus = (typeof TRICK_STATUSES)[number]['value']

export const DEFAULT_TRICK_TAGS = [
  'Self-working',
  'Opener',
  'Closer',
  'Impromptu',
  'Gimmick',
  'Sleight-heavy',
  'Family friendly',
  'Walkaround',
  'Parlor',
  'Stage',
]

export const DIFFICULTY_LABELS = ['', 'Easy', 'Intermediate', 'Advanced', 'Expert'] as const

export const STOCK_STATUSES = [
  { value: 'in_stock', label: 'In stock', badge: 'border-success/40 text-success' },
  { value: 'running_low', label: 'Running low', badge: 'border-warning/50 text-warning' },
  { value: 'out_of_stock', label: 'Out of stock', badge: 'border-destructive/50 text-destructive' },
] as const
export type StockStatus = (typeof STOCK_STATUSES)[number]['value']

export function labelOf<T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? value ?? ''
}

export function findOption<T extends { value: string }>(list: readonly T[], value: string | null | undefined) {
  return list.find((item) => item.value === value)
}
