import { useEffect, useState, useSyncExternalStore } from 'react'

/*
  Practice timer. Lives outside React and in localStorage, so it keeps running
  while navigating between pages and even after a page reload.
*/

export type TimerContext = { title?: string; trickId?: string; routineId?: string }

type TimerState = {
  active: boolean
  /** epoch ms when the current run started, null when paused */
  startedAt: number | null
  /** time accumulated in previous runs */
  accumulatedMs: number
  context: TimerContext
}

const KEY = 'mh:practice-timer'
const IDLE: TimerState = { active: false, startedAt: null, accumulatedMs: 0, context: {} }

function load(): TimerState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...IDLE, ...(JSON.parse(raw) as TimerState) } : IDLE
  } catch {
    return IDLE
  }
}

let state = load()
const listeners = new Set<() => void>()

function set(next: TimerState) {
  state = next
  try {
    if (next.active) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

export const practiceTimer = {
  start(context: TimerContext = {}) {
    set({ active: true, startedAt: Date.now(), accumulatedMs: 0, context })
  },
  pause() {
    if (!state.startedAt) return
    set({ ...state, startedAt: null, accumulatedMs: state.accumulatedMs + Date.now() - state.startedAt })
  },
  resume() {
    if (state.startedAt || !state.active) return
    set({ ...state, startedAt: Date.now() })
  },
  reset() {
    set(IDLE)
  },
  elapsedMs(s: TimerState = state) {
    return s.accumulatedMs + (s.startedAt ? Date.now() - s.startedAt : 0)
  },
}

export function usePracticeTimer() {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
  // re-render every second while running
  const [, tick] = useState(0)
  useEffect(() => {
    if (!snapshot.startedAt) return
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [snapshot.startedAt])

  return {
    ...snapshot,
    running: Boolean(snapshot.startedAt),
    elapsedMs: practiceTimer.elapsedMs(snapshot),
  }
}

export function formatClock(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
