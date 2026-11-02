import { cn } from '@/lib/utils'

type ChipSelectProps<T extends string> = {
  options: readonly { value: T; label: string }[]
  value: T[]
  onChange: (value: T[]) => void
  'aria-label'?: string
  id?: string
}

/** Multi-select rendered as toggle chips (good on mobile, keyboard friendly). */
export function ChipSelect<T extends string>({ options, value, onChange, id, ...aria }: ChipSelectProps<T>) {
  return (
    <div id={id} role="group" aria-label={aria['aria-label']} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? value.filter((v) => v !== option.value) : [...value, option.value])
            }
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              selected
                ? 'border-gold/60 bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:border-gold/40 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
