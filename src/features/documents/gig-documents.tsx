import { Link, useNavigate } from 'react-router'
import { FilePlus2, FileText, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { WriteButton } from '@/components/common/write-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { GigDetail } from '@/features/gigs/api'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency, formatDay } from '@/lib/format'
import { draftFromGig, useBusinessProfile, useCreateDocument, useGigDocuments, type DocumentKind } from './api'
import { DocumentStatusBadge, kindLabel } from './document-status-badge'

/** Quotes and invoices of one gig, with one-click drafts prefilled from the gig. */
export function GigDocuments({ gig }: { gig: GigDetail }) {
  const { data: docs = [], isLoading } = useGigDocuments(gig.id)
  const { data: business } = useBusinessProfile()
  const create = useCreateDocument()
  const navigate = useNavigate()

  function start(kind: DocumentKind) {
    create.mutate(draftFromGig(kind, gig, business), {
      onSuccess: (doc) => navigate(`/app/invoices/${doc.id}`),
      onError: (e) => toast.error(dbErrorMessage(e)),
    })
  }

  if (isLoading) return <Skeleton className="h-16 w-full" />

  return (
    <div className="space-y-3">
      {docs.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                to={`/app/invoices/${d.id}`}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {d.kind === 'quote' ? (
                  <FileText className="size-4 shrink-0 text-sky-500" aria-hidden="true" />
                ) : (
                  <ReceiptText className="size-4 shrink-0 text-gold" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {d.number ?? `${kindLabel(d.kind)} draft`}
                  <span className="text-muted-foreground"> · {formatDay(d.issue_date)}</span>
                </span>
                <span className="tabular-nums">{formatCurrency(Number(d.total), d.currency)}</span>
                <DocumentStatusBadge kind={d.kind} status={d.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <WriteButton size="sm" variant="outline" onClick={() => start('quote')} disabled={create.isPending}>
          <FilePlus2 aria-hidden="true" /> New quote
        </WriteButton>
        <WriteButton size="sm" variant="outline" onClick={() => start('invoice')} disabled={create.isPending}>
          <ReceiptText aria-hidden="true" /> New invoice
        </WriteButton>
      </div>
      {docs.length === 0 && (
        <p className="text-xs text-muted-foreground">The client, the fee and the deposit are filled in from this gig.</p>
      )}
    </div>
  )
}
