import { useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import { Plus, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar, ViewSwitcher, type ViewMode } from '@/components/common/list-toolbar'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useLocalState } from '@/hooks/use-local-state'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { TRICK_CATEGORIES, TRICK_STATUSES, type TrickStatus } from '@/lib/constants'
import { pluralize } from '@/lib/format'
import { useTricks } from './api'
import { TrickFormDialog } from './trick-form-dialog'
import { TrickCards, TrickKanban, TrickTable, sortTricks, type Sort } from './trick-views'

export function TricksPage() {
  const { data, isLoading } = useTricks()
  const tricks = useWithoutPending(data)
  const [view, setView] = useLocalState<ViewMode>('tricks-view', 'table')
  const [sort, setSort] = useLocalState<Sort>('tricks-sort', { key: 'name', dir: 'asc' })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [tag, setTag] = useState('all')
  const [creating, setCreating] = useState<{ status?: TrickStatus } | null>(null)

  const allTags = useMemo(
    () => [...new Set(tricks.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b)),
    [tricks],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = tricks.filter(
      (t) =>
        (view === 'kanban' || status === 'all' || t.status === status) &&
        (category === 'all' || t.categories.includes(category)) &&
        (tag === 'all' || t.tags.includes(tag)) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.effect?.toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q))),
    )
    return sortTricks(result, sort)
  }, [tricks, search, status, category, tag, sort, view])

  const ready = tricks.filter((t) => t.status === 'performance_ready').length
  const polish = tricks.filter((t) => t.status === 'needs_polish').length
  const hasFilters = search || status !== 'all' || category !== 'all' || tag !== 'all'

  return (
    <>
      <PageHeader
        title="Tricks"
        description={
          tricks.length
            ? `${pluralize(tricks.length, 'trick')} · ${ready} performance-ready · ${polish} need polish`
            : 'Your repertoire library.'
        }
        actions={
          <WriteButton onClick={() => setCreating({})}>
            <Plus aria-hidden="true" /> New trick
          </WriteButton>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : tricks.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No tricks yet"
          description="Add the effects you perform or want to learn — with their secret, props, difficulty and progress."
          action={
            <WriteButton onClick={() => setCreating({})}>
              <Plus aria-hidden="true" /> Add your first trick
            </WriteButton>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search tricks…" className="sm:w-64" />
            {view !== 'kanban' && (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-44" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TRICK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-40" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {TRICK_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allTags.length > 0 && (
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="sm:w-40" aria-label="Filter by tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatus('all')
                  setCategory('all')
                  setTag('all')
                }}
              >
                Clear filters
              </Button>
            )}
            <div className="sm:ml-auto">
              <ViewSwitcher value={view} onChange={setView} views={['table', 'cards', 'kanban']} />
            </div>
          </Toolbar>

          <ResultCount shown={filtered.length} total={tricks.length} noun="tricks" />

          {view === 'kanban' ? (
            <TrickKanban tricks={filtered} onAdd={(s) => setCreating({ status: s })} />
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No tricks match your filters.</p>
          ) : view === 'cards' ? (
            <TrickCards tricks={filtered} />
          ) : (
            <TrickTable tricks={filtered} sort={sort} onSort={setSort} />
          )}
        </>
      )}

      <TrickFormDialog
        open={creating !== null}
        onOpenChange={(o) => !o && setCreating(null)}
        defaultStatus={creating?.status}
      />
      <Outlet />
    </>
  )
}
