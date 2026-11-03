import { useMemo, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { AlertTriangle, Clock, ListOrdered, Plus, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { StarRating } from '@/components/common/star-rating'
import { AudienceBadge } from '@/components/common/tag-badge'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { AUDIENCE_TYPES, ROUTINE_STATUSES, findOption } from '@/lib/constants'
import { formatDuration, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRoutines } from './api'
import { RoutineFormDialog } from './routine-form-dialog'

export function RoutineStatusBadge({ status, className }: { status: string; className?: string }) {
  const option = findOption(ROUTINE_STATUSES, status)
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', option?.badge, className)}>
      <span className={cn('size-1.5 rounded-full', option?.dot)} aria-hidden="true" />
      {option?.label ?? status}
    </Badge>
  )
}

export function RoutinesPage() {
  const { data, isLoading } = useRoutines()
  const routines = useWithoutPending(data)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [audience, setAudience] = useState('all')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return routines.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (audience === 'all' || r.audience_types.includes(audience)) &&
        (!q || r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)),
    )
  }, [routines, search, status, audience])

  const ready = routines.filter((r) => r.status === 'ready').length

  return (
    <>
      <PageHeader
        title="Routines"
        description={routines.length ? `${pluralize(routines.length, 'routine')} · ${ready} ready` : 'Setlists built from your tricks.'}
        actions={
          <WriteButton onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> New routine
          </WriteButton>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : routines.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No routines yet"
          description="Combine tricks into ordered setlists with transitions and patter notes. You'll see the total duration and every prop you need."
          action={
            <WriteButton onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" /> Build your first routine
            </WriteButton>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search routines…" className="sm:w-72" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ROUTINE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="sm:w-44" aria-label="Filter by audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All audiences</SelectItem>
                {AUDIENCE_TYPES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Toolbar>
          <ResultCount shown={filtered.length} total={routines.length} noun="routines" />

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No routines match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <Card key={r.id} className="group relative gap-3 p-4 transition-colors hover:border-gold/40">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={r.id}
                      className="font-display text-lg leading-tight font-semibold after:absolute after:inset-0 focus-visible:outline-none group-focus-within:text-gold"
                    >
                      {r.name}
                    </Link>
                    <RoutineStatusBadge status={r.status} className="shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-gold" aria-hidden="true" /> {pluralize(r.trick_count, 'trick')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" /> {formatDuration(r.total_duration_min)}
                    </span>
                    {r.avg_difficulty !== null && <StarRating value={Math.round(Number(r.avg_difficulty))} />}
                  </div>
                  {r.audience_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.audience_types.map((a) => (
                        <AudienceBadge key={a} audience={a} />
                      ))}
                    </div>
                  )}
                  {r.not_ready_count > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-warning">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      {pluralize(r.not_ready_count, 'trick')} not performance-ready
                    </p>
                  )}
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-ring group-has-[a:focus-visible]:ring-2" aria-hidden="true" />
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <RoutineFormDialog open={creating} onOpenChange={setCreating} />
      <Outlet />
    </>
  )
}
