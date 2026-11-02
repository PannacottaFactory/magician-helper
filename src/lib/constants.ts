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
  { value: 'learning', label: 'Learning', dot: 'bg-sky-400', badge: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  {
    value: 'needs_polish',
    label: 'Needs polish',
    dot: 'bg-warning',
    badge: 'border-warning/50 bg-warning/10 text-warning',
  },
  {
    value: 'performance_ready',
    label: 'Performance-ready',
    dot: 'bg-gold',
    badge: 'border-gold/50 bg-gold/10 text-gold',
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
  { value: 'in_stock', label: 'In stock', badge: 'border-success/40 bg-success/10 text-success' },
  { value: 'running_low', label: 'Running low', badge: 'border-warning/50 bg-warning/10 text-warning' },
  { value: 'out_of_stock', label: 'Out of stock', badge: 'border-destructive/50 bg-destructive/10 text-destructive' },
] as const
export type StockStatus = (typeof STOCK_STATUSES)[number]['value']

export function labelOf<T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? value ?? ''
}

export function findOption<T extends { value: string }>(list: readonly T[], value: string | null | undefined) {
  return list.find((item) => item.value === value)
}

export const AUDIENCE_TYPES = [
  { value: 'kids', label: 'Kids' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'street', label: 'Street' },
  { value: 'private_party', label: 'Private party' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'stage_show', label: 'Stage show' },
] as const
export type AudienceType = (typeof AUDIENCE_TYPES)[number]['value']

export const ROUTINE_STATUSES = [
  { value: 'drafting', label: 'Drafting', badge: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-400' },
  { value: 'ready', label: 'Ready', badge: 'border-gold/50 bg-gold/10 text-gold', dot: 'bg-gold' },
] as const
export type RoutineStatus = (typeof ROUTINE_STATUSES)[number]['value']

export const PRACTICE_STATUSES = [
  { value: 'not_started', label: 'Not started', badge: 'border-border text-muted-foreground' },
  { value: 'in_progress', label: 'In progress', badge: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  { value: 'done', label: 'Done', badge: 'border-success/40 bg-success/10 text-success' },
] as const
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number]['value']

export const RATING_LABELS = ['', 'Rough', 'Shaky', 'Decent', 'Solid', 'Nailed it'] as const

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', badge: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  { value: 'deposit_paid', label: 'Deposit paid', badge: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-400' },
  { value: 'invoiced', label: 'Invoiced', badge: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300', dot: 'bg-amber-400' },
  { value: 'fully_paid', label: 'Fully paid', badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-400' },
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]['value']

export const EVENT_TYPES = [
  'Birthday party',
  'Corporate event',
  'Wedding',
  'Private party',
  'Festival',
  'Restaurant / bar',
  'Trade show',
  'School / library',
  'Street show',
  'Theater show',
]

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'US dollar ($)' },
  { value: 'GBP', label: 'British pound (£)' },
  { value: 'CHF', label: 'Swiss franc (CHF)' },
  { value: 'CAD', label: 'Canadian dollar (CA$)' },
  { value: 'AUD', label: 'Australian dollar (A$)' },
  { value: 'JPY', label: 'Japanese yen (¥)' },
  { value: 'SEK', label: 'Swedish krona (kr)' },
  { value: 'NOK', label: 'Norwegian krone (kr)' },
  { value: 'DKK', label: 'Danish krone (kr)' },
  { value: 'PLN', label: 'Polish złoty (zł)' },
  { value: 'BRL', label: 'Brazilian real (R$)' },
] as const
