import { useSyncExternalStore } from 'react'

// Open state of the global search palette, shared by the shortcut, the sidebar and the mobile header.
let open = false
const listeners = new Set<() => void>()

export function setSearchOpen(value: boolean) {
  open = value
  listeners.forEach((l) => l())
}

export function useSearchOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
  )
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const shortcutLabel = isMac ? '⌘K' : 'Ctrl K'
