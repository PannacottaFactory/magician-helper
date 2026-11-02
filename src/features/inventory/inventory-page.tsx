import { useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { BookOpen, Package, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar, ViewSwitcher, type ViewMode } from '@/components/common/list-toolbar'
import { StockBadge } from '@/components/common/status-badge'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProfile } from '@/features/profile/api'
import { useLocalState } from '@/hooks/use-local-state'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { STOCK_STATUSES } from '@/lib/constants'
import { formatCurrency, pluralize } from '@/lib/format'
import { useInventory, useInventoryThumbs, type InventoryRow } from './api'
import { CatalogDialog } from './catalog/catalog-dialog'
import { InventoryFormDialog } from './inventory-form-dialog'
import { ItemVisual } from './item-visual'
import { QuantityStepper } from './quantity-stepper'

export function InventoryPage() {
  const { data, isLoading } = useInventory()
  const items = useWithoutPending(data)
  const [search, setSearch] = useState('')
  const [stock, setStock] = useState('all')
  const [view, setView] = useLocalState<ViewMode>('inventory-view', 'table')
  const [creating, setCreating] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (item) =>
        (stock === 'all' || item.stock_status === stock) &&
        (!q || item.item_name?.toLowerCase().includes(q) || item.notes?.toLowerCase().includes(q)),
    )
  }, [items, search, stock])

  const low = items.filter((i) => i.stock_status === 'running_low').length
  const out = items.filter((i) => i.stock_status === 'out_of_stock').length

  return (
    <>
      <PageHeader
        title="Inventory & gimmicks"
        description={
          items.length
            ? `${pluralize(items.length, 'item')} · ${low} running low · ${out} out of stock`
            : 'Every prop, with stock alerts.'
        }
        actions={
          <>
            <WriteButton variant="outline" onClick={() => setCatalogOpen(true)}>
              <BookOpen aria-hidden="true" /> Add from catalog
            </WriteButton>
            <WriteButton onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" /> New item
            </WriteButton>
          </>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Your prop case is empty"
          description="Track quantities, photos and where to rebuy each prop and gimmick. Start from our catalog of classic props or add your own."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <WriteButton onClick={() => setCatalogOpen(true)}>
                <BookOpen aria-hidden="true" /> Browse classic props
              </WriteButton>
              <WriteButton variant="outline" onClick={() => setCreating(true)}>
                <Plus aria-hidden="true" /> Add my own item
              </WriteButton>
            </div>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search inventory…" className="sm:w-72" />
            <Select value={stock} onValueChange={setStock}>
              <SelectTrigger className="sm:w-44" aria-label="Filter by stock status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock levels</SelectItem>
                {STOCK_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="sm:ml-auto">
              <ViewSwitcher value={view === 'kanban' ? 'table' : view} onChange={setView} views={['table', 'cards']} />
            </div>
          </Toolbar>
          <ResultCount shown={filtered.length} total={items.length} noun="items" />
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No items match your filters.</p>
          ) : view === 'cards' ? (
            <InventoryCards items={filtered} />
          ) : (
            <InventoryTable items={filtered} />
          )}
        </>
      )}

      <InventoryFormDialog open={creating} onOpenChange={setCreating} />
      <CatalogDialog open={catalogOpen} onOpenChange={setCatalogOpen} />
      <Outlet />
    </>
  )
}

function InventoryTable({ items }: { items: InventoryRow[] }) {
  const navigate = useNavigate()
  const thumbs = useInventoryThumbs()
  const { data: profile } = useProfile()
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Used in</TableHead>
            <TableHead className="hidden text-right md:table-cell">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(item.id!)}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <ItemVisual
                    photoUrl={thumbs.get(item.id!)}
                    catalogKey={item.catalog_key}
                    className="h-9 w-12 shrink-0 overflow-hidden rounded-md"
                  />
                  <Link
                    to={item.id!}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.item_name}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <QuantityStepper id={item.id!} name={item.item_name ?? ''} quantity={item.quantity ?? 0} />
              </TableCell>
              <TableCell>
                <StockBadge status={item.stock_status} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {item.trick_count ? pluralize(item.trick_count, 'trick') : '—'}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {formatCurrency(item.cost, profile?.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function InventoryCards({ items }: { items: InventoryRow[] }) {
  const thumbs = useInventoryThumbs()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const thumb = thumbs.get(item.id!)
        return (
          <Card key={item.id} className="group relative gap-0 overflow-hidden py-0 transition-colors hover:border-gold/40">
            <ItemVisual photoUrl={thumb} catalogKey={item.catalog_key} className="aspect-[4/3] w-full" />
            <div className="space-y-2 p-3">
              <Link
                to={item.id!}
                className="block truncate font-medium after:absolute after:inset-0 focus-visible:outline-none group-focus-within:text-gold"
              >
                {item.item_name}
              </Link>
              <div className="relative z-10 flex items-center justify-between gap-2">
                <StockBadge status={item.stock_status} />
                <QuantityStepper id={item.id!} name={item.item_name ?? ''} quantity={item.quantity ?? 0} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-72" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
