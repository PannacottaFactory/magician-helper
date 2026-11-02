import { useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { Plus, Users } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { initials } from '@/components/layout/user-menu'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useProfile } from '@/features/profile/api'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { tagColor } from '@/lib/colors'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClients } from './api'
import { ClientFormDialog } from './client-form-dialog'

export function ClientAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold', tagColor(name), className)}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function ClientsPage() {
  const { data, isLoading } = useClients()
  const clients = useWithoutPending(data)
  const { data: profile } = useProfile()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    )
  }, [clients, search])

  return (
    <>
      <PageHeader
        title="Clients"
        description={clients.length ? pluralize(clients.length, 'client') : 'The people who book you.'}
        actions={
          <WriteButton onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> New client
          </WriteButton>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Keep contacts in one place and see the full history of gigs and fees for each client."
          action={
            <WriteButton onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" /> Add your first client
            </WriteButton>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="sm:w-72" />
          </Toolbar>
          <ResultCount shown={filtered.length} total={clients.length} noun="clients" />
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No clients match your search.</p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Gigs</TableHead>
                    <TableHead className="hidden sm:table-cell">Next gig</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Total fees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(c.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={c.name} />
                          <div className="min-w-0">
                            <Link
                              to={c.id}
                              onClick={(e) => e.stopPropagation()}
                              className="block truncate font-medium hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                              {c.name}
                            </Link>
                            {c.company && <span className="block truncate text-xs text-muted-foreground">{c.company}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        <span className="block truncate">{c.email ?? ''}</span>
                        <span className="block truncate">{c.phone ?? ''}</span>
                      </TableCell>
                      <TableCell className="tabular-nums">{c.gig_count}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {c.next_gig_at ? <span className="text-gold">{formatDate(c.next_gig_at)}</span> : '—'}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {formatCurrency(Number(c.total_fees), profile?.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <ClientFormDialog open={creating} onOpenChange={setCreating} />
      <Outlet />
    </>
  )
}
