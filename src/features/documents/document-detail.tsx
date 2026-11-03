import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Copy, Download, FileCheck2, Loader2, Lock, ReceiptText, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { WriteButton } from '@/components/common/write-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccess } from '@/features/profile/api'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { labelOf, statusesFor } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency, formatDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  copyAsDraft,
  deleteDocument,
  documentKeys,
  sellerFrom,
  useBusinessProfile,
  useCreateDocument,
  useDocument,
  useFinalizeDocument,
  useUpdateDocumentStatus,
  type DocumentRow,
} from './api'
import { DocumentForm } from './document-form'
import { DocumentStatusBadge, kindLabel } from './document-status-badge'

function FinalizedView({ doc }: { doc: DocumentRow }) {
  const money = (n: number | string) => formatCurrency(Number(n), doc.currency)
  return (
    <>
      <p className="mb-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Finalized on {formatDay(doc.finalized_at?.slice(0, 10))}. The content is locked{doc.kind === 'invoice' ? ' (invoice numbers must stay in sequence)' : ''} — duplicate it to make changes.
      </p>
      <div className="mb-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">{doc.kind === 'quote' ? 'Prepared for' : 'Bill to'}</p>
          <p className="font-medium">{doc.buyer_name}</p>
          {doc.buyer_company && <p>{doc.buyer_company}</p>}
          {doc.buyer_address && <p className="whitespace-pre-line text-muted-foreground">{doc.buyer_address}</p>}
          {doc.buyer_email && <p className="text-muted-foreground">{doc.buyer_email}</p>}
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <p>
            <span className="text-muted-foreground">Date: </span>
            {formatDay(doc.issue_date)}
          </p>
          {doc.due_date && (
            <p>
              <span className="text-muted-foreground">{doc.kind === 'quote' ? 'Valid until: ' : 'Due: '}</span>
              {formatDay(doc.due_date)}
            </p>
          )}
          {doc.title && (
            <p>
              <span className="text-muted-foreground">Subject: </span>
              {doc.title}
            </p>
          )}
        </div>
      </div>
      <DetailSection title="Lines">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Unit price</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doc.lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{l.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(l.unit_price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(Math.round(l.quantity * l.unit_price * 100) / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money(doc.subtotal)}</dd>
          </div>
          {Number(doc.tax_rate) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <dt>VAT ({Number(doc.tax_rate)}%)</dt>
              <dd className="tabular-nums">{money(doc.tax_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(doc.total)}</dd>
          </div>
          {Number(doc.deposit_paid) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <dt>Deposit received</dt>
              <dd className="tabular-nums">−{money(doc.deposit_paid)}</dd>
            </div>
          )}
          {doc.kind === 'invoice' && (
            <div className="flex justify-between border-t pt-2 font-semibold text-gold">
              <dt>Amount due</dt>
              <dd className="tabular-nums">{money(doc.amount_due)}</dd>
            </div>
          )}
        </dl>
      </DetailSection>
      {doc.notes && (
        <DetailSection title="Notes">
          <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
        </DetailSection>
      )}
    </>
  )
}

export function DocumentDetail() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: doc, isLoading } = useDocument(docId)
  const { data: business } = useBusinessProfile()
  const { canWrite } = useAccess()
  const finalize = useFinalizeDocument()
  const updateStatus = useUpdateDocumentStatus()
  const create = useCreateDocument()
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), [])
  const close = () => navigate('/app/invoices')
  const undoableDelete = useUndoableDelete({
    onSettled: () => void queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })

  if (!isLoading && !doc) {
    return (
      <DetailPanel open onClose={close} title="Document not found">
        <p className="text-sm text-muted-foreground">This document doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const isDraft = doc?.status === 'draft'
  const label = doc ? kindLabel(doc.kind) : ''
  const missingBusiness = !business?.business_name?.trim()
  const canDelete = doc && (isDraft || doc.kind === 'quote')

  async function download() {
    if (!doc) return
    if (dirty) return toast.info('Save your changes first, then download the PDF.')
    setDownloading(true)
    try {
      const { downloadDocumentPdf } = await import('./pdf/download')
      await downloadDocumentPdf(doc, isDraft ? sellerFrom(business) : (doc.seller ?? sellerFrom(null)))
    } catch (error) {
      console.error(error)
      toast.error('Could not create the PDF. Check your connection and try again.')
    } finally {
      setDownloading(false)
    }
  }

  function duplicate(kind = doc!.kind) {
    create.mutate(copyAsDraft(doc!, kind), {
      onSuccess: (copy) => {
        toast.success(kind === doc!.kind ? `${label} duplicated as a new draft.` : 'Invoice draft created from the quote.')
        navigate(`/app/invoices/${copy.id}`)
      },
      onError: (e) => toast.error(dbErrorMessage(e)),
    })
  }

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      size="lg"
      title={doc ? `${label} ${doc.number ?? 'draft'}` : ''}
      description={
        doc && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <DocumentStatusBadge kind={doc.kind} status={doc.status} />
            <span className="font-medium text-foreground tabular-nums">{formatCurrency(Number(doc.total), doc.currency)}</span>
            {doc.gig_id && (
              <Link to={`/app/gigs/${doc.gig_id}`} className="inline-flex items-center gap-1 hover:text-gold">
                <CalendarDays className="size-3.5" aria-hidden="true" /> Open the gig
              </Link>
            )}
          </span>
        )
      }
      actions={
        doc && (
          <>
            <Button size="sm" variant="outline" onClick={download} disabled={downloading}>
              {downloading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
              {isDraft ? 'Preview PDF' : 'Download PDF'}
            </Button>
            {isDraft ? (
              <WriteButton size="sm" onClick={() => (dirty ? toast.info('Save your changes before finalizing.') : setConfirming(true))}>
                <FileCheck2 aria-hidden="true" /> Finalize
              </WriteButton>
            ) : (
              <>
                <Select
                  value={doc.status}
                  disabled={!canWrite || updateStatus.isPending}
                  onValueChange={(status) =>
                    updateStatus.mutate(
                      { doc, status },
                      {
                        onSuccess: () =>
                          toast.success(
                            `${label} marked as ${labelOf(statusesFor(doc.kind), status).toLowerCase()}.${status === 'paid' && doc.gig_id ? ' The gig is now fully paid.' : ''}`,
                          ),
                        onError: (e) => toast.error(dbErrorMessage(e)),
                      },
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-36" aria-label={`${label} status`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusesFor(doc.kind)
                      .filter((s) => s.value !== 'draft')
                      .map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
                          {s.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {doc.kind === 'quote' && (
                  <WriteButton size="sm" variant="outline" onClick={() => duplicate('invoice')} disabled={create.isPending}>
                    <ReceiptText aria-hidden="true" /> Create invoice
                  </WriteButton>
                )}
                <WriteButton size="sm" variant="outline" onClick={() => duplicate()} disabled={create.isPending}>
                  <Copy aria-hidden="true" /> Duplicate
                </WriteButton>
              </>
            )}
            {canDelete && (
              <WriteButton
                size="sm"
                variant="outline"
                onClick={() => {
                  undoableDelete(doc.id, `${label} ${doc.number ?? 'draft'}`, () => deleteDocument(doc.id))
                  close()
                }}
              >
                <Trash2 aria-hidden="true" /> Delete
              </WriteButton>
            )}
          </>
        )
      }
    >
      {doc && (
        <>
          {isDraft && missingBusiness && (
            <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm">
              <Settings className="size-4 shrink-0 text-gold" aria-hidden="true" />
              Your business details (name, address, tax ID) appear at the top of the PDF.
              <Link to="/app/settings#business" className="font-medium text-gold underline underline-offset-4">
                Add them in Settings
              </Link>
            </p>
          )}
          {isDraft ? <DocumentForm key={`${doc.id}:${doc.updated_at}`} doc={doc} canWrite={canWrite} onDirtyChange={onDirtyChange} /> : <FinalizedView doc={doc} />}

          <AlertDialog open={confirming} onOpenChange={setConfirming}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalize this {label.toLowerCase()}?</AlertDialogTitle>
                <AlertDialogDescription>
                  It gets its number and its content is locked, including your business details as they are now.
                  {doc.kind === 'invoice'
                    ? ' A finalized invoice can no longer be edited or deleted — only marked as paid or canceled.'
                    : ' You can then mark it as accepted or declined, or turn it into an invoice.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Not yet</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    finalize.mutate(doc.id, {
                      onSuccess: (final) => toast.success(`${label} ${final.number} is ready to send.`),
                      onError: (e) => toast.error(dbErrorMessage(e)),
                    })
                  }
                >
                  Finalize
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DetailPanel>
  )
}
