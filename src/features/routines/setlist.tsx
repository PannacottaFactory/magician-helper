import { useState } from 'react'
import { Link } from 'react-router'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, MessageSquareText, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { TrickStatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useAccess } from '@/features/profile/api'
import { useTricks } from '@/features/tricks/api'
import { dbErrorMessage } from '@/lib/db'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useAddTrickToRoutine,
  useRemoveRoutineTrick,
  useReorderRoutine,
  useUpdateTransitionNotes,
  type RoutineTrickItem,
} from './api'

function SetlistRow({ item, index, canWrite }: { item: RoutineTrickItem; index: number; canWrite: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canWrite,
  })
  const remove = useRemoveRoutineTrick()
  const updateNotes = useUpdateTransitionNotes()
  const [notesOpen, setNotesOpen] = useState(Boolean(item.transition_notes))
  const [notes, setNotes] = useState(item.transition_notes ?? '')

  function saveNotes() {
    if ((item.transition_notes ?? '') === notes) return
    updateNotes.mutate(
      { id: item.id, notes },
      { onSuccess: () => toast.success('Notes saved.'), onError: (e) => toast.error(dbErrorMessage(e)) },
    )
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative bg-card', isDragging && 'z-10 rounded-lg shadow-lg ring-1 ring-gold/50')}
    >
      <div className="flex items-center gap-2 px-2 py-2.5">
        {canWrite ? (
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            aria-label={`Reorder ${item.trick?.name}. Press Space to pick up, arrows to move.`}
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="w-6" />
        )}
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {item.trick ? (
            <Link
              to={`/app/tricks/${item.trick.id}`}
              className="block truncate text-sm font-medium hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {item.trick.name}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Deleted trick</span>
          )}
        </div>
        {item.trick && <TrickStatusBadge status={item.trick.status} className="hidden sm:inline-flex" />}
        <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
          {item.trick?.duration_min != null ? formatDuration(item.trick.duration_min) : ''}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className={cn('size-7', notes && 'text-gold')}
          onClick={() => setNotesOpen((o) => !o)}
          aria-expanded={notesOpen}
          aria-label={`Transition notes for ${item.trick?.name ?? 'this trick'}`}
        >
          <MessageSquareText aria-hidden="true" />
        </Button>
        {canWrite && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground"
            onClick={() => remove.mutate(item.id, { onError: (e) => toast.error(dbErrorMessage(e)) })}
            aria-label={`Remove ${item.trick?.name ?? 'trick'} from the routine`}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      {notesOpen && (
        <div className="px-3 pb-3 pl-16">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            readOnly={!canWrite}
            placeholder="Transition, patter line, audience interaction…"
            aria-label={`Transition notes for ${item.trick?.name ?? 'this trick'}`}
            className="text-sm"
          />
        </div>
      )}
    </li>
  )
}

export function Setlist({ routineId, items }: { routineId: string; items: RoutineTrickItem[] }) {
  const { canWrite } = useAccess()
  const reorder = useReorderRoutine(routineId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const nameOf = (id: string | number) => items.find((i) => i.id === id)?.trick?.name ?? 'Trick'
  const positionOf = (id: string | number) => items.findIndex((i) => i.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, position ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} moved to position ${positionOf(over.id)}.` : ''),
    onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)}.` : ''),
    onDragCancel: ({ active }) => `Reordering ${nameOf(active.id)} cancelled.`,
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    const ids = arrayMove(items, from, to).map((i) => i.id)
    reorder.mutate(ids, { onError: (e) => toast.error(dbErrorMessage(e)) })
  }

  return (
    <div className="space-y-2">
      {items.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ announcements }}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ol className="divide-y overflow-hidden rounded-lg border" aria-label="Setlist">
              {items.map((item, index) => (
                <SetlistRow key={item.id} item={item} index={index} canWrite={canWrite} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No tricks yet. Add them in the order you perform them.
        </p>
      )}
      {canWrite && <AddTrickButton routineId={routineId} existing={items.map((i) => i.trick?.id).filter(Boolean) as string[]} />}
    </div>
  )
}

function AddTrickButton({ routineId, existing }: { routineId: string; existing: string[] }) {
  const { data: tricks = [] } = useTricks()
  const add = useAddTrickToRoutine(routineId)
  const [open, setOpen] = useState(false)
  const inRoutine = new Set(existing)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus aria-hidden="true" /> Add a trick
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search your tricks…" />
          <CommandList>
            <CommandEmpty>No trick found.</CommandEmpty>
            <CommandGroup>
              {tricks.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.name} ${t.id}`}
                  onSelect={() =>
                    add.mutate(t.id, {
                      onSuccess: () => toast.success(`“${t.name}” added.`),
                      onError: (e) => toast.error(dbErrorMessage(e)),
                    })
                  }
                >
                  <Check className={cn('size-4', inRoutine.has(t.id) ? 'text-gold opacity-100' : 'opacity-0')} aria-hidden="true" />
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.duration_min != null ? formatDuration(t.duration_min) : ''}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
