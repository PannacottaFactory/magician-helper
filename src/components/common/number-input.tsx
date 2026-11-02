import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type NumberInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined
  onChange: (value: number | null) => void
  decimals?: boolean
}

/** Number field whose value is `number | null` (empty input = null). */
export function NumberInput({ value, onChange, decimals = false, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode={decimals ? 'decimal' : 'numeric'}
      step={decimals ? '0.01' : '1'}
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') return onChange(null)
        const n = Number(raw)
        onChange(Number.isNaN(n) ? null : n)
      }}
      {...props}
    />
  )
}
