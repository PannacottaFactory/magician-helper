import { useState } from 'react'
import { Pause, Play, Square, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PracticeFormDialog, type PracticeDefaults } from './practice-form-dialog'
import { formatClock, practiceTimer, usePracticeTimer } from './timer-store'

/** Floating timer shown on every page while a practice session is running. */
export function PracticeTimerWidget() {
  const timer = usePracticeTimer()
  const [logging, setLogging] = useState<PracticeDefaults | null>(null)

  function stop() {
    practiceTimer.pause()
    const minutes = Math.max(1, Math.round(practiceTimer.elapsedMs() / 60_000))
    setLogging({ ...timer.context, minutes })
  }

  return (
    <>
      {timer.active && (
        <div
          role="region"
          aria-label="Practice timer"
          className={cn(
            'fixed right-4 bottom-20 z-40 flex items-center gap-1 rounded-full border border-gold/50 bg-popover/95 py-1.5 pr-1.5 pl-4 shadow-lg shadow-black/30 backdrop-blur md:bottom-6',
            'animate-in fade-in-0 slide-in-from-bottom-4',
          )}
        >
          <Timer className={cn('mr-1 size-4 text-gold', timer.running && 'animate-pulse')} aria-hidden="true" />
          <span className="mr-2 min-w-14 font-mono text-sm font-semibold tabular-nums" aria-live="off">
            {formatClock(timer.elapsedMs)}
          </span>
          {timer.context.title && (
            <span className="mr-2 hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">{timer.context.title}</span>
          )}
          {timer.running ? (
            <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={practiceTimer.pause} aria-label="Pause timer">
              <Pause aria-hidden="true" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={practiceTimer.resume} aria-label="Resume timer">
              <Play aria-hidden="true" />
            </Button>
          )}
          <Button size="sm" className="h-8 rounded-full" onClick={stop}>
            <Square className="size-3" aria-hidden="true" /> Stop & log
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full text-muted-foreground"
            onClick={practiceTimer.reset}
            aria-label="Discard timer"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      <PracticeFormDialog
        open={logging !== null}
        onOpenChange={(o) => !o && setLogging(null)}
        defaults={logging ?? undefined}
        onSaved={practiceTimer.reset}
      />
    </>
  )
}
