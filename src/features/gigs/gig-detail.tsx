import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarDays, Clock, ClipboardList, ListOrdered, Loader2, MapPin, Pencil, Tag, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientAvatar } from '@/features/clients/clients-page'
import { GigDocuments } from '@/features/documents/gig-documents'
import { useAccess } from '@/features/profile/api'
import { RoutineStatusBadge } from '@/features/routines/routines-page'
import { useNow } from '@/hooks/use-now'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { PAYMENT_STATUSES, labelOf, type PaymentStatus } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency, formatDuration, formatGigWhen, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteGig, fetchShowSheet, gigKeys, useGig, useUpdatePaymentStatus } from './api'
import { GigChecklist } from './gig-checklist'
import { GigFormDialog } from './gig-form-dialog'

export function GigDetailPanel() {
  const { gigId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: gig, isLoading } = useGig(gigId)
  const { canWrite } = useAccess()
  const updatePayment = useUpdatePaymentStatus()
  const [editing, setEditing] = useState(false)
  const [printing, setPrinting] = useState(false)
  const now = useNow()
  const close = () => navigate('/app/gigs')
  const undoableDelete = useUndoableDelete({
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: gigKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  if (!isLoading && !gig) {
    return (
      <DetailPanel open onClose={close} title="Gig not found">
        <p className="text-sm text-muted-foreground">This gig doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const fee = gig?.fee === null || gig?.fee === undefined ? null : Number(gig.fee)
  const deposit = gig?.deposit_amount === null || gig?.deposit_amount === undefined ? null : Number(gig.deposit_amount)
  const received = gig?.payment_status === 'fully_paid' ? (fee ?? 0) : gig?.payment_status === 'deposit_paid' ? (deposit ?? 0) : 0
  const balance = fee === null ? null : Math.max(0, fee - received)
  const routines = gig?.gig_routines.filter((gr) => gr.routine) ?? []
  const showMinutes = routines.reduce(
    (s, gr) => s + (gr.routine?.routine_tricks.reduce((t, rt) => t + (rt.trick?.duration_min ?? 0), 0) ?? 0),
    0,
  )
  const notReady = routines.flatMap((gr) => gr.routine?.routine_tricks.filter((rt) => rt.trick && rt.trick.status !== 'performance_ready') ?? [])
  const isPast = gig ? new Date(gig.starts_at).getTime() < now : false
  async function downloadShowSheet() {
    if (!gig) return
    setPrinting(true)
    try {
      const [{ downloadShowSheetPdf }, data] = await Promise.all([import('@/features/documents/pdf/download'), fetchShowSheet(gig.id)])
      await downloadShowSheetPdf(data)
    } catch (error) {
      console.error(error)
      toast.error('Could not create the show sheet. Check your connection and try again.')
    } finally {
      setPrinting(false)
    }
  }
  const mapsUrl = gig?.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gig.location)}` : null

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      size="lg"
      title={gig?.title}
      description={
        gig && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-gold" aria-hidden="true" /> {formatGigWhen(gig.starts_at, gig.ends_at)}
            </span>
            <span className={cn('text-xs', isPast ? 'text-muted-foreground' : 'text-gold')}>{formatRelative(gig.starts_at)}</span>
          </span>
        )
      }
      actions={
        gig && (
          <>
            <Button size="sm" variant="outline" onClick={downloadShowSheet} disabled={printing}>
              {printing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}
              Show sheet
            </Button>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            <WriteButton
              size="sm"
              variant="outline"
              onClick={() => {
                undoableDelete(gig.id, gig.title, () => deleteGig(gig.id))
                close()
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {gig && (
        <>
          <div className="mb-6 grid gap-2 text-sm sm:grid-cols-2">
            {gig.client && (
              <Link
                to={`/app/clients/${gig.client.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ClientAvatar name={gig.client.name} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{gig.client.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {gig.client.company ?? gig.client.phone ?? gig.client.email ?? 'Client'}
                  </span>
                </span>
              </Link>
            )}
            {!gig.client && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-muted-foreground">
                <User className="size-4" aria-hidden="true" /> No client linked
              </div>
            )}
            <div className="space-y-1 rounded-lg border p-3">
              {gig.location ? (
                <a
                  href={mapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-gold"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    {gig.location}
                    <span className="sr-only"> (open in maps, new tab)</span>
                  </span>
                </a>
              ) : (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden="true" /> No location
                </p>
              )}
              {gig.event_type && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="size-4" aria-hidden="true" /> {gig.event_type}
                </p>
              )}
            </div>
          </div>

          <DetailSection title="Payment">
            <div className="rounded-lg border p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-2xl font-semibold tabular-nums">{formatCurrency(fee, gig.currency)}</p>
                <Select
                  value={gig.payment_status}
                  disabled={!canWrite}
                  onValueChange={(status) =>
                    updatePayment.mutate(
                      { id: gig.id, status: status as PaymentStatus },
                      {
                        onSuccess: () => toast.success(`Payment marked as ${labelOf(PAYMENT_STATUSES, status).toLowerCase()}.`),
                        onError: (e) => toast.error(dbErrorMessage(e)),
                      },
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-44" aria-label="Payment status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Deposit</dt>
                  <dd className="tabular-nums">{formatCurrency(deposit, gig.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Received</dt>
                  <dd className="text-success tabular-nums">{formatCurrency(received, gig.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Balance due</dt>
                  <dd className={cn('tabular-nums', balance ? 'font-medium text-warning' : '')}>{formatCurrency(balance, gig.currency)}</dd>
                </div>
              </dl>
            </div>
          </DetailSection>

          <DetailSection title="Quotes & invoices">
            <GigDocuments gig={gig} />
          </DetailSection>

          <DetailSection title={`Routines${showMinutes ? ` · ${formatDuration(showMinutes)} of show` : ''}`}>
            {notReady.length > 0 && (
              <p className="mb-2 flex items-center gap-2 text-sm text-warning" role="status">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                {notReady.length === 1 ? '1 trick is' : `${notReady.length} tricks are`} not performance-ready yet.
              </p>
            )}
            {routines.length ? (
              <ul className="divide-y rounded-lg border">
                {routines.map((gr) => (
                  <li key={gr.id}>
                    <Link
                      to={`/app/routines/${gr.routine!.id}`}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <ListOrdered className="size-4 shrink-0 text-violet-500" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{gr.routine!.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        {formatDuration(gr.routine!.routine_tricks.reduce((t, rt) => t + (rt.trick?.duration_min ?? 0), 0))}
                      </span>
                      <RoutineStatusBadge status={gr.routine!.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No routines linked. Edit the gig to choose what you'll perform.</p>
            )}
          </DetailSection>

          <DetailSection title="Preparation checklist">
            <GigChecklist gigId={gig.id} />
          </DetailSection>

          {gig.notes && (
            <DetailSection title="Notes">
              <p className="text-sm whitespace-pre-wrap">{gig.notes}</p>
            </DetailSection>
          )}

          <GigFormDialog open={editing} onOpenChange={setEditing} gig={gig} />
        </>
      )}
    </DetailPanel>
  )
}
