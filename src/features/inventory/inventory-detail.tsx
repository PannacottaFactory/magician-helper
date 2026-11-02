import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink, FileText, ImagePlus, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { StockBadge, TrickStatusBadge } from '@/components/common/status-badge'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { useAccess, useProfile } from '@/features/profile/api'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency, formatFileSize, safeUrl } from '@/lib/format'
import {
  deleteInventoryItem,
  inventoryKeys,
  useDeleteFile,
  useInventoryItem,
  useSignedUrls,
  useUploadFiles,
  type InventoryFile,
} from './api'
import { CatalogIllustration } from './catalog/illustrations'
import { InventoryFormDialog } from './inventory-form-dialog'
import { QuantityStepper } from './quantity-stepper'

export function InventoryDetail() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: item, isLoading } = useInventoryItem(itemId)
  const { data: profile } = useProfile()
  const [editing, setEditing] = useState(false)
  const close = () => navigate('/app/inventory')
  const undoableDelete = useUndoableDelete({
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['tricks'] })
    },
  })

  function onDelete() {
    if (!item) return
    undoableDelete(item.id, item.item_name, () => deleteInventoryItem(item.id))
    close()
  }

  if (!isLoading && !item) {
    return (
      <DetailPanel open onClose={close} title="Item not found">
        <p className="text-sm text-muted-foreground">This item doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  const photos = item?.inventory_files.filter((f) => f.kind === 'photo') ?? []
  const files = item?.inventory_files.filter((f) => f.kind === 'file') ?? []
  const buyLink = safeUrl(item?.buy_link)

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      title={item?.item_name}
      description={item && <StockBadge status={item.stock_status} />}
      actions={
        item && (
          <>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            <WriteButton size="sm" variant="outline" onClick={onDelete}>
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {item && (
        <>
          <DetailSection title="Stock">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border p-3">
              <QuantityStepper id={item.id} name={item.item_name} quantity={item.quantity} />
              <span className="text-sm text-muted-foreground">Alert at {item.low_stock_threshold} or fewer</span>
            </div>
          </DetailSection>

          <PhotosSection itemId={item.id} photos={photos} catalogKey={item.catalog_key} />
          <FilesSection itemId={item.id} files={files} />

          <DetailSection title="Used in tricks">
            {item.trick_props.length ? (
              <ul className="divide-y rounded-lg border">
                {item.trick_props.map((tp) =>
                  tp.trick ? (
                    <li key={tp.id}>
                      <Link
                        to={`/app/tricks/${tp.trick.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span>
                          {tp.trick.name}
                          {tp.quantity_needed > 1 && <span className="text-muted-foreground"> × {tp.quantity_needed}</span>}
                        </span>
                        <TrickStatusBadge status={tp.trick.status} />
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not linked to any trick yet. Link it from a trick's form.</p>
            )}
          </DetailSection>

          <DetailSection title="Purchase">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Cost</dt>
              <dd>{formatCurrency(item.cost, profile?.currency)}</dd>
              <dt className="text-muted-foreground">Buy link</dt>
              <dd className="min-w-0">
                {buyLink ? (
                  <a
                    href={buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 text-gold underline-offset-4 hover:underline"
                  >
                    <span className="truncate">{new URL(buyLink).hostname}</span>
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
          </DetailSection>

          {item.notes && (
            <DetailSection title="Notes">
              <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
            </DetailSection>
          )}

          <InventoryFormDialog open={editing} onOpenChange={setEditing} item={item} />
        </>
      )}
    </DetailPanel>
  )
}

function UploadButton({ itemId, accept, label }: { itemId: string; accept?: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadFiles(itemId)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const list = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!list.length) return
          upload.mutate(list, {
            onSuccess: () => toast.success(list.length === 1 ? 'File uploaded.' : `${list.length} files uploaded.`),
            onError: (error) => toast.error(dbErrorMessage(error)),
          })
        }}
      />
      <WriteButton size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
        {upload.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
        {label}
      </WriteButton>
    </>
  )
}

function PhotosSection({
  itemId,
  photos,
  catalogKey,
}: {
  itemId: string
  photos: InventoryFile[]
  catalogKey: string | null
}) {
  const urls = useSignedUrls(photos.map((p) => p.storage_path))
  const deleteFile = useDeleteFile()
  const { canWrite } = useAccess()
  return (
    <DetailSection title="Photos" action={<UploadButton itemId={itemId} accept="image/*" label="Add photos" />}>
      {photos.length ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const url = urls.data?.[photo.storage_path]
            return (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${photo.file_name}`}>
                    <img src={url} alt={photo.file_name} className="size-full object-cover" loading="lazy" />
                  </a>
                )}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() =>
                      deleteFile.mutate(photo, { onError: (e) => toast.error(dbErrorMessage(e)) })
                    }
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={`Delete photo ${photo.file_name}`}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : catalogKey ? (
        <figure className="max-w-xs">
          <CatalogIllustration catalogKey={catalogKey} className="aspect-[4/3] w-full overflow-hidden rounded-lg border" />
          <figcaption className="mt-1.5 text-xs text-muted-foreground">Catalog illustration — add your own photo anytime.</figcaption>
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      )}
    </DetailSection>
  )
}

function FilesSection({ itemId, files }: { itemId: string; files: InventoryFile[] }) {
  const urls = useSignedUrls(files.map((f) => f.storage_path))
  const deleteFile = useDeleteFile()
  const { canWrite } = useAccess()
  return (
    <DetailSection title="Files" action={<UploadButton itemId={itemId} label="Add files" />}>
      {files.length ? (
        <ul className="divide-y rounded-lg border">
          {files.map((file) => {
            const url = urls.data?.[file.storage_path]
            return (
              <li key={file.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{file.file_name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size_bytes)}</span>
                {url && (
                  <Button asChild size="icon" variant="ghost" className="size-7">
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Download ${file.file_name}`}>
                      <Download aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {canWrite && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={`Delete ${file.file_name}`}
                    onClick={() => deleteFile.mutate(file, { onError: (e) => toast.error(dbErrorMessage(e)) })}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Instructions, PDFs, receipts…</p>
      )}
    </DetailSection>
  )
}
