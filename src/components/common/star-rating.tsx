import { useId, type KeyboardEvent } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number | null | undefined
  max?: number
  size?: 'sm' | 'md'
  className?: string
  label?: string
}

/** Read-only stars. */
export function StarRating({ value, max = 4, size = 'sm', className, label = 'Difficulty' }: StarRatingProps) {
  const v = value ?? 0
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${label}: ${v} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            size === 'sm' ? 'size-3.5' : 'size-4',
            i < v ? 'fill-gold text-gold' : 'fill-transparent text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}

type StarInputProps = {
  value: number | null | undefined
  onChange: (value: number | null) => void
  max?: number
  labels?: readonly string[]
  'aria-label'?: string
  id?: string
}

/** Accessible star picker (radio group). Click the current value again to clear it. */
export function StarInput({ value, onChange, max = 4, labels, id, ...props }: StarInputProps) {
  const name = useId()
  const v = value ?? 0

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(Math.min(max, v + 1))
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(v <= 1 ? null : v - 1)
    }
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={props['aria-label']}
      className="flex items-center gap-1"
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        const checked = v === n
        return (
          <button
            key={n}
            type="button"
            role="radio"
            name={name}
            aria-checked={checked}
            aria-label={labels?.[n] ? `${n} – ${labels[n]}` : `${n}`}
            tabIndex={checked || (v === 0 && n === 1) ? 0 : -1}
            onClick={() => onChange(checked ? null : n)}
            className="rounded p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Star
              aria-hidden="true"
              className={cn(
                'size-5 transition-colors',
                n <= v ? 'fill-gold text-gold' : 'fill-transparent text-muted-foreground/50 hover:text-gold/70',
              )}
            />
          </button>
        )
      })}
      {labels && v > 0 && <span className="ml-2 text-xs text-muted-foreground">{labels[v]}</span>}
    </div>
  )
}
