import { useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { FilePlus2, FileText, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useProfile } from '@/features/profile/api'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { INVOICE_STATUSES, QUOTE_STATUSES } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency, formatDay } from '@/lib/format'
import { blankDraft, useBusinessProfile, useCreateDocument, useDocuments, type DocumentKind, type DocumentRow } from './api'
import { DocumentStatusBadge, kindLabel } from './document-status-badge'

type KindFilter = 'all' | DocumentKind

/** "€1,200.00 + $300.00" — totals grouped by currency. */
function sumByCurrency(docs: DocumentRow[], pick: (d: DocumentRow) => number) {
  const sums = new Map<string, number>()
  for (const d of docs) sums.set(d.currency, (sums.get(d.currency) ?? 0) + pick(d))
  return [...sums].map(([currency, amount]) => formatCurrency(amount, currency)).join(' + ') || formatCurrency(0)
}

export function useCreateBlankDocument() {
  const create = useCreateDocument()
  const navigate = useNavigate()
  const { data: business } = useBusinessProfile()
  const { data: profile } = useProfile()
  return {
    pending: create.isPending,
    start: (kind: DocumentKind) =>
      create.mutate(blankDraft(kind, business, profile?.currency ?? 'EUR'), {
        onSuccess: (doc) => navigate(`/app/invoices/${doc.id}`),
        onError: (e) => toast.error(dbErrorMessage(e)),
      }),
  }
}

export function DocumentsPage() {
  const { data, isLoading } = useDocuments()
  const docs = useWithoutPending(data)
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const blank = useCreateBlankDocument()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter(
      (d) =>
        (kind === 'all' || d.kind === kind) &&
        (status === 'all' || d.status === status) &&
        (!q || [d.number, d.buyer_name, d.buyer_company, d.title].some((v) => v?.toLowerCase().includes(q))),
    )
  }, [docs, kind, status, search])

  const outstanding = docs.filter((d) => d.kind === 'invoice' && d.status === 'issued')
  const openQuotes = docs.filter((d) => d.kind === 'quote' && d.status === 'sent')
  const statusOptions = kind === 'quote' ? QUOTE_STATUSES : kind === 'invoice' ? INVOICE_STATUSES : []

  return (
    <>
      <PageHeader
        title="Invoices"
        description={
          docs.length
            ? `${outstanding.length ? `${sumByCurrency(outstanding, (d) => Number(d.amount_due))} outstanding` : 'Nothing outstanding'} · ${openQuotes.length} open quote${openQuotes.length === 1 ? '' : 's'}`
            : 'Quotes and invoices for your gigs.'
        }
        actions={
          <>
            <WriteButton variant="outline" onClick={() => blank.start('quote')} disabled={blank.pending}>
              <FilePlus2 aria-hidden="true" /> New quote
            </WriteButton>
            <WriteButton onClick={() => blank.start('invoice')} disabled={blank.pending}>
              <ReceiptText aria-hidden="true" /> New invoice
            </WriteButton>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes or invoices yet"
          description="Open a gig and create a quote or an invoice in one click: the client, the fee and the deposit are filled in for you."
          action={
            <Link to="/app/gigs" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
              Go to your gigs
            </Link>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search number or client…" className="sm:w-72" />
            <ToggleGroup
              type="single"
              variant="outline"
              value={kind}
              onValueChange={(v) => {
                if (!v) return
                setKind(v as KindFilter)
                setStatus('all')
              }}
              aria-label="Document type"
            >
              <ToggleGroupItem value="all" className="px-3">All</ToggleGroupItem>
              <ToggleGroupItem value="quote" className="px-3">Quotes</ToggleGroupItem>
              <ToggleGroupItem value="invoice" className="px-3">Invoices</ToggleGroupItem>
            </ToggleGroup>
            {kind !== 'all' && (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-40" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Toolbar>
          <ResultCount shown={filtered.length} total={docs.length} noun="documents" />

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No documents match your filters.</p>
          ) : (
            <Card className="gap-0 divide-y overflow-hidden p-0">
              {filtered.map((d) => (
                <Link
                  key={d.id}
                  to={d.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:grid-cols-[9rem_minmax(0,1fr)_7rem_8rem_7rem]"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {d.kind === 'quote' ? (
                      <FileText className="size-4 shrink-0 text-sky-500" aria-hidden="true" />
                    ) : (
                      <ReceiptText className="size-4 shrink-0 text-gold" aria-hidden="true" />
                    )}
                    <span className="truncate">{d.number ?? `${kindLabel(d.kind)} draft`}</span>
                  </span>
                  <span className="order-3 min-w-0 truncate text-sm text-muted-foreground sm:order-none">
                    {[d.buyer_company || d.buyer_name, d.title].filter(Boolean).join(' · ') || 'No client yet'}
                  </span>
                  <span className="hidden text-sm text-muted-foreground sm:block">{formatDay(d.issue_date)}</span>
                  <span className="text-right text-sm font-medium tabular-nums sm:order-none">{formatCurrency(Number(d.total), d.currency)}</span>
                  <span className="order-4 justify-self-end sm:order-none">
                    <DocumentStatusBadge kind={d.kind} status={d.status} />
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </>
      )}
      <Outlet />
    </>
  )
}
