import { useMemo, useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { tagColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  id?: string
  'aria-describedby'?: string
}

/** Free tags with suggestions. Enter or comma adds the typed tag. */
export function TagInput({ value, onChange, suggestions = [], placeholder = 'Add a tag…', id, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const lowerValue = useMemo(() => new Set(value.map((t) => t.toLowerCase())), [value])
  const visibleSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase()
    return suggestions
      .filter((s) => !lowerValue.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q)))
      .slice(0, 12)
  }, [draft, suggestions, lowerValue])

  function add(tag: string) {
    const clean = tag.trim().replace(/\s+/g, ' ').slice(0, 40)
    if (!clean || lowerValue.has(clean.toLowerCase())) return
    onChange([...value, clean])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', tagColor(tag))}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-full opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : placeholder}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          {...aria}
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus className="size-3" aria-hidden="true" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
