// Colorful, readable chips (AA contrast in both themes).
// Each tag always gets the same color, derived from its text.

const PALETTE = [
  'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300',
  'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-300',
  'border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300',
  'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  'border-lime-500/30 bg-lime-500/10 text-lime-800 dark:text-lime-300',
  'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
] as const

function hash(text: string) {
  let h = 0
  for (const char of text.toLowerCase()) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

export function tagColor(tag: string) {
  return PALETTE[hash(tag) % PALETTE.length]
}

/** Fixed colors for known values (categories, audiences). */
export const CATEGORY_COLORS: Record<string, string> = {
  card: PALETTE[0],
  coin: PALETTE[1],
  mentalism: PALETTE[4],
  stage: PALETTE[7],
  close_up: PALETTE[3],
  other: 'border-border bg-muted text-muted-foreground',
}

export const AUDIENCE_COLORS: Record<string, string> = {
  kids: PALETTE[1],
  corporate: PALETTE[3],
  street: PALETTE[6],
  private_party: PALETTE[7],
  wedding: PALETTE[0],
  stage_show: PALETTE[4],
}
