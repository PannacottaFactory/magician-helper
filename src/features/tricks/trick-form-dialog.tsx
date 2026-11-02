import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ChipSelect } from '@/components/common/chip-select'
import { NumberInput } from '@/components/common/number-input'
import { StarInput } from '@/components/common/star-rating'
import { TagInput } from '@/components/common/tag-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DIFFICULTY_LABELS, TRICK_CATEGORIES, TRICK_STATUSES, type TrickCategory } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { useSaveTrick, useTrickTagSuggestions, type Trick } from './api'
import { PropsPicker } from './props-picker'
import { trickSchema, type TrickValues } from './schemas'

export type TrickWithProps = Trick & {
  trick_props?: { item_id: string; quantity_needed: number; item: { item_name: string } | null }[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trick?: TrickWithProps | null
  /** Status pre-selected when creating from a kanban column. */
  defaultStatus?: string
}

function toValues(trick?: TrickWithProps | null, defaultStatus = 'to_learn'): TrickValues {
  return {
    name: trick?.name ?? '',
    effect: trick?.effect ?? '',
    secret_and_setup: trick?.secret_and_setup ?? '',
    categories: trick?.categories ?? [],
    difficulty: trick?.difficulty ?? null,
    duration_min: trick?.duration_min ?? null,
    status: trick?.status ?? defaultStatus,
    tags: trick?.tags ?? [],
    video_url: trick?.video_url ?? '',
    references_text: trick?.references_text ?? '',
    other_props: trick?.other_props ?? '',
    notes: trick?.notes ?? '',
    props:
      trick?.trick_props?.map((tp) => ({
        item_id: tp.item_id,
        item_name: tp.item?.item_name ?? '',
        quantity_needed: tp.quantity_needed,
      })) ?? [],
  }
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-xs font-semibold tracking-wider text-gold uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

export function TrickFormDialog({ open, onOpenChange, trick, defaultStatus }: Props) {
  const save = useSaveTrick()
  const navigate = useNavigate()
  const tagSuggestions = useTrickTagSuggestions()
  const form = useForm<TrickValues>({
    resolver: zodResolver(trickSchema),
    defaultValues: toValues(trick, defaultStatus),
  })

  useEffect(() => {
    if (open) form.reset(toValues(trick, defaultStatus))
  }, [open, trick, defaultStatus, form])

  async function onSubmit({ props, ...values }: TrickValues) {
    try {
      const saved = await save.mutateAsync({
        id: trick?.id,
        values: {
          ...values,
          effect: values.effect || null,
          secret_and_setup: values.secret_and_setup || null,
          video_url: values.video_url || null,
          references_text: values.references_text || null,
          other_props: values.other_props || null,
          notes: values.notes || null,
        },
        props: props.map((p) => ({ item_id: p.item_id, quantity_needed: p.quantity_needed ?? 1 })),
      })
      onOpenChange(false)
      if (trick) toast.success('Trick updated.')
      else {
        toast.success(`“${saved.name}” added to your repertoire.`)
        navigate(`/app/tricks/${saved.id}`)
      }
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{trick ? `Edit “${trick.name}”` : 'New trick'}</DialogTitle>
          <DialogDescription>Only the name is required — fill in the rest whenever you like.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormSection title="Essentials">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ambitious Card" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effect</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="What the audience sees…" {...field} />
                    </FormControl>
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
                          {TRICK_STATUSES.map((s) => (
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
                  name="duration_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <NumberInput min={0} max={600} placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <FormControl>
                      <StarInput value={field.value} onChange={field.onChange} labels={DIFFICULTY_LABELS} aria-label="Difficulty" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <FormControl>
                      <ChipSelect
                        options={TRICK_CATEGORIES}
                        value={field.value as TrickCategory[]}
                        onChange={field.onChange}
                        aria-label="Categories"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} suggestions={tagSuggestions} />
                    </FormControl>
                    <FormDescription>Pick a suggestion or type your own and press Enter.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Method">
              <FormField
                control={form.control}
                name="secret_and_setup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret & setup</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Method, setup, key moves…" {...field} />
                    </FormControl>
                    <FormDescription>Hidden by default when viewing the trick.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Props">
              <FormField
                control={form.control}
                name="props"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From your inventory</FormLabel>
                    <PropsPicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other_props"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Everyday props</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder={'Sharpie\nRubber band'} {...field} />
                    </FormControl>
                    <FormDescription>Things you don't track in inventory — one per line.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="References & notes">
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video link</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="references_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>References & credits</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Book, DVD, creator…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {trick ? 'Save changes' : 'Add trick'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
