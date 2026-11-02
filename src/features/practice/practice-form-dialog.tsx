import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/common/number-input'
import { StarInput } from '@/components/common/star-rating'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRoutines } from '@/features/routines/api'
import { useTricks } from '@/features/tricks/api'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { PRACTICE_STATUSES, RATING_LABELS } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { todayISO } from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'
import { deletePractice, practiceKeys, useSavePractice, type PracticeLog } from './api'

const NONE = 'none'

const practiceSchema = z.object({
  practiced_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  title: z.string().trim().min(1, 'What did you work on?').max(200, 'Too long'),
  trick_id: z.string(),
  routine_id: z.string(),
  time_spent_min: z.number().int('Whole minutes only').min(0).max(1440, 'Max 24 h').nullable(),
  status: z.enum(['not_started', 'in_progress', 'done']),
  self_rating: z.number().int().min(1).max(5).nullable(),
  notes_and_flaws_to_fix: z.string().max(20_000),
})
type PracticeValues = z.infer<typeof practiceSchema>

export type PracticeDefaults = {
  title?: string
  trickId?: string
  routineId?: string
  minutes?: number
}

function toValues(log?: PracticeLog | null, defaults?: PracticeDefaults): PracticeValues {
  return {
    practiced_on: log?.practiced_on ?? todayISO(),
    title: log?.title ?? defaults?.title ?? '',
    trick_id: log?.trick_id ?? defaults?.trickId ?? NONE,
    routine_id: log?.routine_id ?? defaults?.routineId ?? NONE,
    time_spent_min: log?.time_spent_min ?? defaults?.minutes ?? null,
    status: (log?.status as PracticeValues['status']) ?? 'done',
    self_rating: log?.self_rating ?? null,
    notes_and_flaws_to_fix: log?.notes_and_flaws_to_fix ?? '',
  }
}

export function PracticeFormDialog({
  open,
  onOpenChange,
  log,
  defaults,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  log?: PracticeLog | null
  defaults?: PracticeDefaults
  onSaved?: () => void
}) {
  const save = useSavePractice()
  const queryClient = useQueryClient()
  const { data: tricks = [] } = useTricks()
  const { data: routines = [] } = useRoutines()
  const undoableDelete = useUndoableDelete({
    onSettled: () => void queryClient.invalidateQueries({ queryKey: practiceKeys.all }),
  })
  const form = useForm<PracticeValues>({ resolver: zodResolver(practiceSchema), defaultValues: toValues(log, defaults) })

  useEffect(() => {
    if (open) form.reset(toValues(log, defaults))
  }, [open, log, defaults, form])

  // Picking a trick pre-fills the title if it's empty
  const trickId = useWatch({ control: form.control, name: 'trick_id' })
  useEffect(() => {
    if (trickId !== NONE && !form.getValues('title')) {
      const trick = tricks.find((t) => t.id === trickId)
      if (trick) form.setValue('title', trick.name)
    }
  }, [trickId, tricks, form])

  async function onSubmit(values: PracticeValues) {
    try {
      await save.mutateAsync({
        id: log?.id,
        values: {
          ...values,
          trick_id: values.trick_id === NONE ? null : values.trick_id,
          routine_id: values.routine_id === NONE ? null : values.routine_id,
          notes_and_flaws_to_fix: values.notes_and_flaws_to_fix || null,
        },
      })
      toast.success(log ? 'Session updated.' : 'Practice session logged. Keep it up!')
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{log ? 'Edit practice session' : 'Log practice'}</DialogTitle>
          <DialogDescription>What you worked on, how long, and what still needs fixing.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-[1fr_8rem] gap-4">
              <FormField
                control={form.control}
                name="practiced_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" max={todayISO()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_spent_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <NumberInput min={0} placeholder="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="trick_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trick (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>No specific trick</SelectItem>
                      {tricks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technique or sleight</FormLabel>
                  <FormControl>
                    <Input placeholder="Double lift, classic pass…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="routine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Routine (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>No routine</SelectItem>
                      {routines.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRACTICE_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="self_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did it go?</FormLabel>
                    <FormControl>
                      <StarInput max={5} value={field.value} onChange={field.onChange} labels={RATING_LABELS} aria-label="Self rating" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes_and_flaws_to_fix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes & flaws to fix</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Flashing on the second lift, angle issue on the left…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:justify-between">
              {log ? (
                <WriteButton
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    undoableDelete(log.id, log.title, () => deletePractice(log.id))
                    onOpenChange(false)
                  }}
                >
                  <Trash2 aria-hidden="true" /> Delete
                </WriteButton>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {log ? 'Save changes' : 'Log session'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
