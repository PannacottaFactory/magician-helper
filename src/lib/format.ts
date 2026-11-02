const LOCALE = 'en-GB'

export function formatCurrency(amount: number | null | undefined, currency = 'EUR') {
  if (amount === null || amount === undefined) return '—'
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(LOCALE, options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
}

/** Today as YYYY-MM-DD in the user's time zone. */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses a YYYY-MM-DD date as a local date (not UTC midnight). */
export function parseDay(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—'
  return formatDate(parseDay(value), options)
}

/** 'today', 'yesterday', '3 days ago' for a YYYY-MM-DD date. */
export function formatDayRelative(value: string | null | undefined) {
  if (!value) return 'never'
  const days = Math.round((parseDay(todayISO()).getTime() - parseDay(value).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return formatRelative(parseDay(value))
}

export function formatDuration(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return 'never'
  const diffDays = Math.round((new Date(value).getTime() - Date.now()) / 86_400_000)
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
  if (Math.abs(diffDays) < 1) return 'today'
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month')
  return rtf.format(Math.round(diffDays / 365), 'year')
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Only http(s) links are rendered as clickable — blocks `javascript:` URLs. */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Plain-text preview of stored rich-text HTML. */
export function htmlToText(html: string | null | undefined) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('p, li, h1, h2, h3, blockquote, br').forEach((el) => el.append(' '))
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
