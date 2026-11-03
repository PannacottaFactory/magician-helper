import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { StarRating } from '@/components/common/star-rating'
import { CategoryBadge, TagList } from '@/components/common/tag-badge'
import { TrickStatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAccess } from '@/features/profile/api'
import { TRICK_STATUSES, labelOf, type TrickStatus } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatDayRelative, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUpdateTrickStatus, type TrickRow } from './api'

/* ------------------------------------------------------------------ Table */

export type SortKey = 'name' | 'status' | 'difficulty' | 'duration_min' | 'updated_at' | 'last_practiced'
export type Sort = { key: SortKey; dir: 'asc' | 'desc' }

const STATUS_ORDER = Object.fromEntries(TRICK_STATUSES.map((s, i) => [s.value, i]))

export function sortTricks(tricks: TrickRow[], { key, dir }: Sort) {
  const factor = dir === 'asc' ? 1 : -1
  return [...tricks].sort((a, b) => {
    let diff = 0
    if (key === 'name') diff = a.name.localeCompare(b.name)
    else if (key === 'status') diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    else if (key === 'updated_at') diff = a.updated_at.localeCompare(b.updated_at)
    else if (key === 'last_practiced') {
      if (!a.last_practiced && !b.last_practiced) diff = 0
      else if (!a.last_practiced) return 1
      else if (!b.last_practiced) return -1
      else diff = a.last_practiced.localeCompare(b.last_practiced)
    }
    else {
      // empty values always last
      const av = a[key]
      const bv = b[key]
      if (av === null && bv === null) diff = 0
      else if (av === null) return 1
      else if (bv === null) return -1
      else diff = av - bv
    }
    return diff * factor || a.name.localeCompare(b.name)
  })
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: Sort
  onSort: (sort: Sort) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort({ key: sortKey, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
        className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {label}
        <Icon className={cn('size-3.5', active ? 'text-gold' : 'opacity-50')} aria-hidden="true" />
      </button>
    </TableHead>
  )
}

export function TrickTable({ tricks, sort, onSort }: { tricks: TrickRow[]; sort: Sort; onSort: (sort: Sort) => void }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
            <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <TableHead className="hidden lg:table-cell">Categories</TableHead>
            <SortHeader label="Difficulty" sortKey="difficulty" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
            <SortHeader label="Duration" sortKey="duration_min" sort={sort} onSort={onSort} className="hidden md:table-cell" />
            <SortHeader label="Last practiced" sortKey="last_practiced" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tricks.map((trick) => (
            <TableRow key={trick.id} className="cursor-pointer" onClick={() => navigate(trick.id)}>
              <TableCell className="max-w-64 font-medium">
                <Link
                  to={trick.id}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate rounded hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {trick.name}
                </Link>
              </TableCell>
              <TableCell>
                <TrickStatusBadge status={trick.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {trick.categories.length ? (
                    trick.categories.map((c) => <CategoryBadge key={c} category={c} />)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {trick.difficulty ? <StarRating value={trick.difficulty} /> : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                {formatDuration(trick.duration_min)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDayRelative(trick.last_practiced)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ------------------------------------------------------------------ Cards */

function TrickCardContent({ trick }: { trick: TrickRow }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {trick.difficulty && <StarRating value={trick.difficulty} />}
        {trick.duration_min !== null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" /> {formatDuration(trick.duration_min)}
          </span>
        )}
        {trick.last_practiced && <span>Practiced {formatDayRelative(trick.last_practiced)}</span>}
      </div>
      <TagList tags={trick.tags} max={4} />
    </>
  )
}

export function TrickCards({ tricks }: { tricks: TrickRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tricks.map((trick) => (
        <Card key={trick.id} className="group relative gap-3 p-4 transition-colors hover:border-gold/40">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={trick.id}
              className="font-display text-lg leading-tight font-semibold after:absolute after:inset-0 focus-visible:outline-none group-focus-within:text-gold"
            >
              {trick.name}
            </Link>
            <TrickStatusBadge status={trick.status} className="shrink-0" />
          </div>
          {trick.effect && <p className="line-clamp-2 text-sm text-muted-foreground">{trick.effect}</p>}
          <TrickCardContent trick={trick} />
          {/* visible focus ring for the whole card */}
          <span className="pointer-events-none absolute inset-0 rounded-xl ring-ring group-has-[a:focus-visible]:ring-2" aria-hidden="true" />
        </Card>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- Kanban */

function KanbanCard({ trick, overlay = false }: { trick: TrickRow; overlay?: boolean }) {
  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border bg-card p-3 text-left shadow-sm',
        overlay && 'rotate-2 border-gold/60 shadow-xl shadow-black/30',
      )}
    >
      <p className="text-sm leading-snug font-medium">{trick.name}</p>
      <TrickCardContent trick={trick} />
    </div>
  )
}

function DraggableCard({ trick, disabled }: { trick: TrickRow; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: trick.id, disabled })
  const navigate = useNavigate()
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable trick"
      aria-label={`${trick.name}. Press Space to move it to another status, Enter to open.`}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter' && !isDragging) navigate(trick.id)
      }}
      onClick={() => navigate(trick.id)}
      className={cn(
        'cursor-grab touch-manipulation rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing',
        isDragging && 'opacity-30',
        disabled && 'cursor-pointer',
      )}
    >
      <KanbanCard trick={trick} />
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  dot,
  tricks,
  disabled,
  onAdd,
}: {
  status: TrickStatus
  label: string
  dot: string
  tricks: TrickRow[]
  disabled: boolean
  onAdd: (status: TrickStatus) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      aria-label={`${label}, ${tricks.length} tricks`}
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-xl border bg-muted/40 transition-colors md:w-auto md:min-w-0 md:flex-1',
        isOver && 'border-gold/60 bg-accent/50',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
          {label}
          <span className="font-normal text-muted-foreground">{tricks.length}</span>
        </h2>
        {!disabled && (
          <Button size="icon" variant="ghost" className="size-7" onClick={() => onAdd(status)} aria-label={`Add a trick to ${label}`}>
            <Plus aria-hidden="true" />
          </Button>
        )}
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 p-2 pt-0">
        {tricks.map((trick) => (
          <DraggableCard key={trick.id} trick={trick} disabled={disabled} />
        ))}
      </div>
    </section>
  )
}

export function TrickKanban({ tricks, onAdd }: { tricks: TrickRow[]; onAdd: (status: TrickStatus) => void }) {
  const updateStatus = useUpdateTrickStatus()
  const { canWrite } = useAccess()
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    // Space picks up / drops a card; Enter is kept for opening it
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] } }),
  )
  const nameOf = (id: string | number) => tricks.find((t) => t.id === id)?.name ?? 'Trick'
  const statusLabel = (id: string | number | undefined) => labelOf(TRICK_STATUSES, id ? String(id) : '')

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} is over ${statusLabel(over.id)}.` : `${nameOf(active.id)} is no longer over a column.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} moved to ${statusLabel(over.id)}.` : `${nameOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return
    const trick = tricks.find((t) => t.id === active.id)
    const status = String(over.id) as TrickStatus
    if (!trick || trick.status === status) return
    updateStatus.mutate(
      { id: trick.id, status },
      {
        onSuccess: () => toast.success(`“${trick.name}” is now ${statusLabel(status)}.`),
        onError: (e) => toast.error(dbErrorMessage(e)),
      },
    )
  }

  const active = tricks.find((t) => t.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {TRICK_STATUSES.map((s) => (
          <KanbanColumn
            key={s.value}
            status={s.value}
            label={s.label}
            dot={s.dot}
            tricks={tricks.filter((t) => t.status === s.value)}
            disabled={!canWrite}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay>{active ? <KanbanCard trick={active} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
