import { useCallback, useState } from 'react'

/** useState persisted in localStorage (per-browser UI preferences like the chosen view). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`mh:${key}`)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(`mh:${key}`, JSON.stringify(next))
      } catch {
        // ignore
      }
    },
    [key],
  )
  return [value, set] as const
}
