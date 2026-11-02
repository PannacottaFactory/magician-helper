import { useEffect, useId } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/common/rich-text'
import { TagInput } from '@/components/common/tag-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTricks } from '@/features/tricks/api'
import { dbErrorMessage } from '@/lib/db'
import { useIdeaTagSuggestions, useSaveIdea, type Idea } from './api'

const ideaSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Too long'),
  content: z.string().max(200_000, 'Too long'),
  tags: z.array(z.string().max(40)).max(30),
  trick_id: z.string(),
})
type IdeaValues = z.infer<typeof ideaSchema>

const NO_TRICK = 'none'

function toValues(idea?: Idea | null): IdeaValues {
  return {
    title: idea?.title ?? '',
    content: idea?.content ?? '',
    tags: idea?.tags ?? [],
    trick_id: idea?.trick_id ?? NO_TRICK,
  }
}

export function IdeaFormDialog({
  open,
  onOpenChange,
  idea,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea?: Idea | null
}) {
  const save = useSaveIdea()
  const navigate = useNavigate()
  const { data: tricks = [] } = useTricks()
  const tagSuggestions = useIdeaTagSuggestions()
  const contentLabelId = useId()
  const form = useForm<IdeaValues>({ resolver: zodResolver(ideaSchema), defaultValues: toValues(idea) })

  useEffect(() => {
    if (open) form.reset(toValues(idea))
  }, [open, idea, form])

  async function onSubmit(values: IdeaValues) {
    try {
      const saved = await save.mutateAsync({
        id: idea?.id,
        values: {
          title: values.title,
          content: values.content || null,
          tags: values.tags,
          trick_id: values.trick_id === NO_TRICK ? null : values.trick_id,
        },
      })
      onOpenChange(false)
      toast.success(idea ? 'Idea saved.' : 'Idea captured.')
      if (!idea) navigate(`/app/ideas/${saved.id}`)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{idea ? 'Edit idea' : 'New idea'}</DialogTitle>
          <DialogDescription>Plots, presentations, patter lines — capture it before it vanishes.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Card to impossible location" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id={contentLabelId}>Notes</FormLabel>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Describe the idea…"
                    aria-labelledby={contentLabelId}
                  />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trick_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related trick (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_TRICK}>No related trick</SelectItem>
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {idea ? 'Save changes' : 'Save idea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
