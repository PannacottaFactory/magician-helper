import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarDays, Clock, Gauge, Pencil, Sparkles, Timer, Trash2 } from 'lucide-react'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { StarRating } from '@/components/common/star-rating'
import { StockBadge } from '@/components/common/status-badge'
import { AudienceBadge } from '@/components/common/tag-badge'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { ItemVisual } from '@/features/inventory/item-visual'
import { PracticeFormDialog } from '@/features/practice/practice-form-dialog'
import { practiceTimer } from '@/features/practice/timer-store'
import { useNow } from '@/hooks/use-now'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { formatDate, formatDayRelative, formatDuration, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteRoutine, routineKeys, useRoutine, useRoutineProps } from './api'
import { RoutineFormDialog } from './routine-form-dialog'
import { RoutineStatusBadge } from './routines-page'
import { Setlist } from './setlist'

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </p>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export function RoutineDetail() {
  const { routineId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: routine, isLoading } = useRoutine(routineId)
  const { data: props = [] } = useRoutineProps(routineId)
  const [editing, setEditing] = useState(false)
  const [logging, setLogging] = useState(false)
  const now = useNow()
  const close = () => navigate('/app/routines')
  const undoableDelete = useUndoableDelete({
    onSettled: () => void queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  })

  if (!isLoading && !routine) {
    return (
      <DetailPanel open onClose={close} title="Routine not found">
        <p className="text-sm text-muted-foreground">This routine doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const tricks = routine?.routine_tricks ?? []
  const totalDuration = tricks.reduce((s, rt) => s + (rt.trick?.duration_min ?? 0), 0)
  const difficulties = tricks.map((rt) => rt.trick?.difficulty).filter((d): d is number => d != null)
  const avgDifficulty = difficulties.length ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length : null
  const notReady = tricks.filter((rt) => rt.trick && rt.trick.status !== 'performance_ready')
  const otherProps = [
    ...new Set(
      tricks.flatMap((rt) => rt.trick?.other_props?.split('\n').map((l) => l.trim()).filter(Boolean) ?? []),
    ),
  ]
  const gigs = (routine?.gig_routines ?? [])
    .flatMap((gr) => (gr.gig ? [gr.gig] : []))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  const missing = props.filter((p) => (p.quantity ?? 0) < (p.quantity_needed ?? 1))

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      size="lg"
      title={routine?.name}
      description={
        routine && (
          <div className="flex flex-wrap items-center gap-1.5">
            <RoutineStatusBadge status={routine.status} />
            {routine.audience_types.map((a) => (
              <AudienceBadge key={a} audience={a} />
            ))}
          </div>
        )
      }
      actions={
        routine && (
          <>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            <WriteButton size="sm" variant="outline" onClick={() => practiceTimer.start({ title: routine.name, routineId: routine.id })}>
              <Timer aria-hidden="true" /> Rehearse
            </WriteButton>
            <WriteButton
              size="sm"
              variant="outline"
              onClick={() => {
                undoableDelete(routine.id, routine.name, () => deleteRoutine(routine.id))
                close()
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {routine && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-2">
            <Stat icon={Sparkles} label="Tricks" value={tricks.length} />
            <Stat icon={Clock} label="Duration" value={formatDuration(totalDuration)} />
            <Stat
              icon={Gauge}
              label="Avg difficulty"
              value={avgDifficulty ? <StarRating value={Math.round(avgDifficulty)} size="md" /> : '—'}
            />
          </div>

          {notReady.length > 0 && (
            <div className="mb-6 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <p>
                <span className="font-medium">{pluralize(notReady.length, 'trick')} not performance-ready: </span>
                {notReady.map((rt) => rt.trick?.name).join(', ')}
              </p>
            </div>
          )}

          {routine.description && (
            <DetailSection title="Description">
              <p className="text-sm whitespace-pre-wrap">{routine.description}</p>
            </DetailSection>
          )}

          <DetailSection title="Setlist">
            <Setlist routineId={routine.id} items={tricks} />
          </DetailSection>

          <DetailSection title="Props needed">
            {missing.length > 0 && (
              <p className="mb-2 flex items-center gap-2 text-sm text-warning" role="status">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Not enough stock: {missing.map((p) => p.item_name).join(', ')}
              </p>
            )}
            {props.length === 0 && otherProps.length === 0 ? (
              <p className="text-sm text-muted-foreground">The tricks in this routine have no props listed.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {props.map((p) => (
                  <li key={p.item_id}>
                    <Link
                      to={`/app/inventory/${p.item_id}`}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <ItemVisual catalogKey={p.catalog_key} className="h-7 w-9 shrink-0 overflow-hidden rounded" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {p.item_name}
                          {(p.quantity_needed ?? 1) > 1 && <span className="text-muted-foreground"> × {p.quantity_needed}</span>}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{p.used_by_tricks?.join(', ')}</span>
                      </span>
                      <StockBadge status={p.stock_status} />
                    </Link>
                  </li>
                ))}
                {otherProps.map((line) => (
                  <li key={line} className="px-3 py-2 text-sm text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection title="Performed at">
            {gigs.length ? (
              <ul className="divide-y rounded-lg border">
                {gigs.map((gig) => {
                  const past = new Date(gig.starts_at).getTime() < now
                  return (
                    <li key={gig.id}>
                      <Link
                        to={`/app/gigs/${gig.id}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <CalendarDays className={cn('size-4 shrink-0', past ? 'text-muted-foreground' : 'text-gold')} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{gig.title}</span>
                        <span className={cn('text-xs tabular-nums', past ? 'text-muted-foreground' : 'text-gold')}>
                          {formatDate(gig.starts_at)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not booked for any gig yet.</p>
            )}
          </DetailSection>

          <DetailSection
            title="Rehearsals"
            action={
              <Button size="sm" variant="ghost" onClick={() => setLogging(true)}>
                Log a rehearsal
              </Button>
            }
          >
            {routine.practice_logs.length ? (
              <ul className="space-y-1 text-sm">
                {routine.practice_logs.slice(0, 5).map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{log.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDayRelative(log.practiced_on)} · {formatDuration(log.time_spent_min)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not rehearsed yet.</p>
            )}
          </DetailSection>

          <RoutineFormDialog open={editing} onOpenChange={setEditing} routine={routine} />
          <PracticeFormDialog
            open={logging}
            onOpenChange={setLogging}
            defaults={{ title: routine.name, routineId: routine.id }}
          />
        </>
      )}
    </DetailPanel>
  )
}
