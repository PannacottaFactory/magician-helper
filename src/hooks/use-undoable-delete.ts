import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { dbErrorMessage } from '@/lib/db'

/*
  Deleting with "Undo": the item disappears immediately from every list, a toast
  offers Undo for a few seconds, and the real DELETE is only sent afterwards.
  Pending deletions are kept in a tiny module-level store.
*/

const UNDO_DELAY_MS = 6000

type Pending = { id: string; commit: () => Promise<void>; timer: number; toastId: string | number }
const pending = new Map<string, Pending>()
const listeners = new Set<() => void>()
let snapshot = new Set<string>()

function emit() {
  snapshot = new Set(pending.keys())
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function run(entry: Pending, onError?: () => void) {
  try {
    await entry.commit()
  } catch (error) {
    toast.error(`Could not delete: ${dbErrorMessage(error)}`)
    onError?.()
  }
}

/** Run every pending deletion now (used when the tab is closing). */
function flushAll() {
  pending.forEach((entry) => {
    window.clearTimeout(entry.timer)
    toast.dismiss(entry.toastId)
    void run(entry)
  })
  pending.clear()
  emit()
}

let unloadHandlerInstalled = false
function installUnloadHandler() {
  if (unloadHandlerInstalled) return
  unloadHandlerInstalled = true
  window.addEventListener('beforeunload', (event) => {
    if (pending.size === 0) return
    flushAll()
    event.preventDefault() // gives the requests a chance to finish
  })
}

/** Ids currently waiting to be deleted (hidden from the UI). */
export function usePendingDeletes() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/** Removes items that are pending deletion from a list. */
export function useWithoutPending<T extends { id: string | null }>(items: T[] | undefined): T[] {
  const ids = usePendingDeletes()
  return (items ?? []).filter((item) => !item.id || !ids.has(item.id))
}

type Options = {
  /** Called after the real delete (success or failure) — e.g. invalidate queries. */
  onSettled?: () => void
}

export function useUndoableDelete({ onSettled }: Options = {}) {
  useEffect(installUnloadHandler, [])

  return useCallback(
    (id: string, label: string, commit: () => Promise<void>) => {
      if (pending.has(id)) return
      const entry: Pending = { id, commit, timer: 0, toastId: '' }
      entry.timer = window.setTimeout(async () => {
        toast.dismiss(entry.toastId)
        await run(entry)
        pending.delete(id)
        emit()
        onSettled?.()
      }, UNDO_DELAY_MS)
      entry.toastId = toast(`“${label}” deleted`, {
        duration: UNDO_DELAY_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            window.clearTimeout(entry.timer)
            pending.delete(id)
            emit()
          },
        },
      })
      pending.set(id, entry)
      emit()
    },
    [onSettled],
  )
}
