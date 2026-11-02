import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, ExternalLink, Mail, Pencil, Phone, Trash2 } from 'lucide-react'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { WriteButton } from '@/components/common/write-button'
import { GigFormDialog } from '@/features/gigs/gig-form-dialog'
import { PaymentBadge } from '@/features/gigs/payment-badge'
import { useProfile } from '@/features/profile/api'
import { useNow } from '@/hooks/use-now'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { formatCurrency, formatDate, safeUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { clientKeys, deleteClient, useClient } from './api'
import { ClientFormDialog } from './client-form-dialog'
import { ClientAvatar } from './clients-page'

export function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: client, isLoading } = useClient(clientId)
  const { data: profile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [booking, setBooking] = useState(false)
  const now = useNow()
  const close = () => navigate('/app/clients')
  const undoableDelete = useUndoableDelete({
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['gigs'] })
    },
  })

  if (!isLoading && !client) {
    return (
      <DetailPanel open onClose={close} title="Client not found">
        <p className="text-sm text-muted-foreground">This client doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const gigs = client?.gigs ?? []
  const upcoming = gigs.filter((g) => new Date(g.starts_at).getTime() >= now).reverse()
  const past = gigs.filter((g) => new Date(g.starts_at).getTime() < now)
  const total = gigs.reduce((s, g) => s + Number(g.fee ?? 0), 0)
  const link = safeUrl(client?.contact_link)

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      title={
        client && (
          <span className="flex items-center gap-3">
            <ClientAvatar name={client.name} className="size-10 text-sm" />
            {client.name}
          </span>
        )
      }
      description={client?.company ?? undefined}
      actions={
        client && (
          <>
            <WriteButton size="sm" onClick={() => setBooking(true)}>
              <CalendarPlus aria-hidden="true" /> New gig
            </WriteButton>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            <WriteButton
              size="sm"
              variant="outline"
              onClick={() => {
                undoableDelete(client.id, client.name, () => deleteClient(client.id))
                close()
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {client && (
        <>
          <DetailSection title="Contact">
            {client.email || client.phone || link ? (
              <ul className="space-y-1.5 text-sm">
                {client.email && (
                  <li>
                    <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 hover:text-gold">
                      <Mail className="size-4 text-muted-foreground" aria-hidden="true" /> {client.email}
                    </a>
                  </li>
                )}
                {client.phone && (
                  <li>
                    <a href={`tel:${client.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 hover:text-gold">
                      <Phone className="size-4 text-muted-foreground" aria-hidden="true" /> {client.phone}
                    </a>
                  </li>
                )}
                {link && (
                  <li>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold">
                      <ExternalLink className="size-4 text-muted-foreground" aria-hidden="true" /> {new URL(link).hostname}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No contact details.</p>
            )}
          </DetailSection>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {[
              ['Gigs', String(gigs.length)],
              ['Upcoming', String(upcoming.length)],
              ['Total fees', formatCurrency(total, profile?.currency)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <DetailSection title="Gig history">
            {gigs.length ? (
              <ul className="divide-y rounded-lg border">
                {[...upcoming, ...past].map((g) => {
                  const isPast = new Date(g.starts_at).getTime() < now
                  return (
                    <li key={g.id}>
                      <Link
                        to={`/app/gigs/${g.id}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className={cn('w-24 shrink-0 text-xs tabular-nums', isPast ? 'text-muted-foreground' : 'font-medium text-gold')}>
                          {formatDate(g.starts_at)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{g.title}</span>
                        <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                          {formatCurrency(g.fee === null ? null : Number(g.fee), g.currency)}
                        </span>
                        <PaymentBadge status={g.payment_status} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No gigs with this client yet.</p>
            )}
          </DetailSection>

          {client.notes && (
            <DetailSection title="Notes">
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </DetailSection>
          )}

          <ClientFormDialog open={editing} onOpenChange={setEditing} client={client} />
          <GigFormDialog open={booking} onOpenChange={setBooking} defaults={{ clientId: client.id }} />
        </>
      )}
    </DetailPanel>
  )
}
