import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ChipSelect } from '@/components/common/chip-select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AUDIENCE_TYPES, ROUTINE_STATUSES, type AudienceType } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { useSaveRoutine, type Routine } from './api'

const routineSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Too long'),
  status: z.enum(['drafting', 'ready']),
  audience_types: z.array(z.enum(['kids', 'corporate', 'street', 'private_party', 'wedding', 'stage_show'])),
  description: z.string().max(20_000),
})
type RoutineValues = z.infer<typeof routineSchema>

function toValues(routine?: Routine | null): RoutineValues {
  return {
    name: routine?.name ?? '',
    status: (routine?.status as RoutineValues['status']) ?? 'drafting',
    audience_types: (routine?.audience_types as AudienceType[]) ?? [],
    description: routine?.description ?? '',
  }
}

export function RoutineFormDialog({
  open,
  onOpenChange,
  routine,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine?: Routine | null
}) {
  const save = useSaveRoutine()
  const navigate = useNavigate()
  const form = useForm<RoutineValues>({ resolver: zodResolver(routineSchema), defaultValues: toValues(routine) })

  useEffect(() => {
    if (open) form.reset(toValues(routine))
  }, [open, routine, form])

  async function onSubmit(values: RoutineValues) {
    try {
      const saved = await save.mutateAsync({
        id: routine?.id,
        values: { ...values, description: values.description || null },
      })
      onOpenChange(false)
      if (routine) toast.success('Routine updated.')
      else {
        toast.success(`“${saved.name}” created — now add some tricks.`)
        navigate(`/app/routines/${saved.id}`)
      }
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{routine ? 'Edit routine' : 'New routine'}</DialogTitle>
          <DialogDescription>A setlist of tricks for a type of show.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Corporate walkaround — 20 min" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {ROUTINE_STATUSES.map((s) => (
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
              name="audience_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audiences</FormLabel>
                  <FormControl>
                    <ChipSelect options={AUDIENCE_TYPES} value={field.value} onChange={field.onChange} aria-label="Audiences" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Theme, structure, staging…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {routine ? 'Save changes' : 'Create routine'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
