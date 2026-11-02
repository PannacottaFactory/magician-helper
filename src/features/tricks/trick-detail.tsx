import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  Lightbulb,
  ListOrdered,
  NotebookPen,
  Pencil,
  PlayCircle,
  Timer,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { StarRating } from '@/components/common/star-rating'
import { StockBadge } from '@/components/common/status-badge'
import { CategoryBadge, TagList } from '@/components/common/tag-badge'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ItemVisual } from '@/features/inventory/item-visual'
import { PracticeFormDialog } from '@/features/practice/practice-form-dialog'
import { practiceTimer } from '@/features/practice/timer-store'
import { useAccess } from '@/features/profile/api'
import { RoutineStatusBadge } from '@/features/routines/routines-page'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { DIFFICULTY_LABELS, TRICK_STATUSES, labelOf, type TrickStatus } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatDate, formatDayRelative, formatDuration, pluralize, safeUrl } from '@/lib/format'
import { deleteTrick, trickKeys, useTrick, useUpdateTrickStatus } from './api'
import { TrickFormDialog } from './trick-form-dialog'

export function TrickDetail() {
  const { trickId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: trick, isLoading } = useTrick(trickId)
  const { canWrite } = useAccess()
  const updateStatus = useUpdateTrickStatus()
  const [editing, setEditing] = useState(false)
  const [logging, setLogging] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const secretId = useId()
  const close = () => navigate('/app/tricks')
  const undoableDelete = useUndoableDelete({
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: trickKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['ideas'] })
    },
  })

  if (!isLoading && !trick) {
    return (
      <DetailPanel open onClose={close} title="Trick not found">
        <p className="text-sm text-muted-foreground">This trick doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const video = safeUrl(trick?.video_url)
  const otherProps = trick?.other_props?.split('\n').map((l) => l.trim()).filter(Boolean) ?? []
  // routines using this trick (once each, even if it appears twice in a setlist)
  const routines = [
    ...new Map(
      (trick?.routine_tricks ?? []).flatMap((rt) => (rt.routine ? [[rt.routine.id, rt.routine] as const] : [])),
    ).values(),
  ]
  const missingProps = trick?.trick_props.filter((tp) => tp.item && tp.item.quantity < tp.quantity_needed) ?? []

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      title={trick?.name}
      description={
        trick && (
          <Select
            value={trick.status}
            disabled={!canWrite}
            onValueChange={(status) =>
              updateStatus.mutate(
                { id: trick.id, status: status as TrickStatus },
                {
                  onSuccess: () => {
                    toast.success(`Status changed to ${labelOf(TRICK_STATUSES, status)}.`)
                    void queryClient.invalidateQueries({ queryKey: trickKeys.detail(trick.id) })
                  },
                  onError: (e) => toast.error(dbErrorMessage(e)),
                },
              )
            }
          >
            <SelectTrigger size="sm" className="w-48" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRICK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      actions={
        trick && (
          <>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            <WriteButton
              size="sm"
              variant="outline"
              onClick={() => {
                undoableDelete(trick.id, trick.name, () => deleteTrick(trick.id))
                close()
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {trick && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {trick.difficulty ? (
              <span className="inline-flex items-center gap-2">
                <StarRating value={trick.difficulty} size="md" />
                <span className="text-muted-foreground">{DIFFICULTY_LABELS[trick.difficulty]}</span>
              </span>
            ) : null}
            {trick.duration_min !== null && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" /> {formatDuration(trick.duration_min)}
              </span>
            )}
            {trick.categories.map((c) => (
              <CategoryBadge key={c} category={c} />
            ))}
          </div>

          {trick.tags.length > 0 && (
            <TagList tags={trick.tags} className="-mt-3 mb-6" />
          )}

          <DetailSection title="Effect">
            {trick.effect ? (
              <p className="text-sm whitespace-pre-wrap">{trick.effect}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </DetailSection>

          <DetailSection
            title="Secret & setup"
            action={
              trick.secret_and_setup && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-expanded={revealed}
                  aria-controls={secretId}
                  onClick={() => setRevealed((r) => !r)}
                >
                  {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  {revealed ? 'Hide' : 'Reveal'}
                </Button>
              )
            }
          >
            {trick.secret_and_setup ? (
              <div id={secretId}>
                {revealed ? (
                  <p className="rounded-lg border border-gold/30 bg-accent/40 p-3 text-sm whitespace-pre-wrap">
                    {trick.secret_and_setup}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground hover:border-gold/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Hidden from prying eyes — tap to reveal
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No method written yet.</p>
            )}
          </DetailSection>

          <DetailSection title="Props">
            {missingProps.length > 0 && (
              <p className="mb-2 flex items-center gap-2 text-sm text-warning" role="status">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Not enough stock for {missingProps.map((p) => p.item?.item_name).join(', ')}.
              </p>
            )}
            {trick.trick_props.length === 0 && otherProps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No props listed.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {trick.trick_props.map((tp) =>
                  tp.item ? (
                    <li key={tp.id}>
                      <Link
                        to={`/app/inventory/${tp.item.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <ItemVisual catalogKey={tp.item.catalog_key} className="h-7 w-9 shrink-0 overflow-hidden rounded" />
                          <span className="truncate">
                            {tp.item.item_name}
                            {tp.quantity_needed > 1 && <span className="text-muted-foreground"> × {tp.quantity_needed}</span>}
                          </span>
                        </span>
                        <StockBadge status={tp.item.stock_status} />
                      </Link>
                    </li>
                  ) : null,
                )}
                {otherProps.map((line) => (
                  <li key={line} className="px-3 py-2 text-sm text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection
            title="Practice"
            action={
              <div className="flex gap-1">
                <WriteButton size="sm" variant="ghost" onClick={() => practiceTimer.start({ title: trick.name, trickId: trick.id })}>
                  <Timer aria-hidden="true" /> Start timer
                </WriteButton>
                <WriteButton size="sm" variant="ghost" onClick={() => setLogging(true)}>
                  <NotebookPen aria-hidden="true" /> Log
                </WriteButton>
              </div>
            }
          >
            {trick.practice_logs.length ? (
              <>
                <p className="mb-2 text-sm">
                  Last practiced{' '}
                  <span className="font-medium text-gold">{formatDayRelative(trick.practice_logs[0].practiced_on)}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {pluralize(trick.practice_logs.length, 'session')} ·{' '}
                    {formatDuration(trick.practice_logs.reduce((s, l) => s + (l.time_spent_min ?? 0), 0))} in total
                  </span>
                </p>
                <ul className="space-y-1 text-sm">
                  {trick.practice_logs.slice(0, 5).map((log) => (
                    <li key={log.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted-foreground">{log.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {log.self_rating && <StarRating value={log.self_rating} max={5} label="Self rating" />}
                        {formatDayRelative(log.practiced_on)} · {formatDuration(log.time_spent_min)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Never practiced yet.</p>
            )}
          </DetailSection>

          <DetailSection title="In routines">
            {routines.length ? (
              <ul className="divide-y rounded-lg border">
                {routines.map((routine) => (
                  <li key={routine.id}>
                    <Link
                      to={`/app/routines/${routine.id}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ListOrdered className="size-4 text-violet-500" aria-hidden="true" /> {routine.name}
                      </span>
                      <RoutineStatusBadge status={routine.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not part of any routine yet.</p>
            )}
          </DetailSection>

          {(video || trick.references_text) && (
            <DetailSection title="References">
              {video && (
                <a
                  href={video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 inline-flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline"
                >
                  <PlayCircle className="size-4" aria-hidden="true" /> Watch video
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              {trick.references_text && <p className="text-sm whitespace-pre-wrap">{trick.references_text}</p>}
            </DetailSection>
          )}

          {trick.notes && (
            <DetailSection title="Notes">
              <p className="text-sm whitespace-pre-wrap">{trick.notes}</p>
            </DetailSection>
          )}

          {trick.ideas.length > 0 && (
            <DetailSection title="Related ideas">
              <ul className="space-y-1">
                {trick.ideas.map((idea) => (
                  <li key={idea.id}>
                    <Link
                      to={`/app/ideas/${idea.id}`}
                      className="inline-flex items-center gap-2 text-sm hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Lightbulb className="size-4 text-gold" aria-hidden="true" /> {idea.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          <p className="text-xs text-muted-foreground">
            Added {formatDate(trick.created_at)} · Updated {formatDate(trick.updated_at)}
          </p>

          <TrickFormDialog open={editing} onOpenChange={setEditing} trick={trick} />
          <PracticeFormDialog open={logging} onOpenChange={setLogging} defaults={{ title: trick.name, trickId: trick.id }} />
        </>
      )}
    </DetailPanel>
  )
}
