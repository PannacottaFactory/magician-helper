import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { DetailPanel, DetailSection } from '@/components/common/detail-panel'
import { RichTextView } from '@/components/common/rich-text'
import { WriteButton } from '@/components/common/write-button'
import { TagList } from '@/components/common/tag-badge'
import { useUndoableDelete } from '@/hooks/use-undoable-delete'
import { dbErrorMessage } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { deleteIdea, ideaKeys, useConvertIdeaToTrick, useIdeas } from './api'
import { IdeaFormDialog } from './idea-form-dialog'

export function IdeaDetail() {
  const { ideaId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading } = useIdeas()
  const idea = data?.find((i) => i.id === ideaId)
  const convert = useConvertIdeaToTrick()
  const [editing, setEditing] = useState(false)
  const close = () => navigate('/app/ideas')
  const undoableDelete = useUndoableDelete({
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['tricks'] })
    },
  })

  if (!isLoading && !idea) {
    return (
      <DetailPanel open onClose={close} title="Idea not found">
        <p className="text-sm text-muted-foreground">This idea doesn't exist anymore.</p>
      </DetailPanel>
    )
  }

  function onConvert() {
    if (!idea) return
    convert.mutate(idea.id, {
      onSuccess: (trickId) => {
        toast.success(`“${idea.title}” is now a trick. Complete its details!`)
        navigate(`/app/tricks/${trickId}`)
      },
      onError: (e) => toast.error(dbErrorMessage(e)),
    })
  }

  return (
    <DetailPanel
      open
      onClose={close}
      loading={isLoading}
      title={idea?.title}
      description={idea && `Captured ${formatDate(idea.created_at)}`}
      actions={
        idea && (
          <>
            <WriteButton size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" /> Edit
            </WriteButton>
            {!idea.trick_id && (
              <WriteButton size="sm" onClick={onConvert} disabled={convert.isPending}>
                {convert.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Wand2 aria-hidden="true" />}
                Convert to trick
              </WriteButton>
            )}
            <WriteButton
              size="sm"
              variant="outline"
              onClick={() => {
                undoableDelete(idea.id, idea.title, () => deleteIdea(idea.id))
                close()
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </WriteButton>
          </>
        )
      }
    >
      {idea && (
        <>
          {idea.trick && (
            <DetailSection title="Related trick">
              <Link
                to={`/app/tricks/${idea.trick.id}`}
                className="inline-flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline"
              >
                <Sparkles className="size-4" aria-hidden="true" /> {idea.trick.name}
              </Link>
            </DetailSection>
          )}
          <DetailSection title="Notes">
            {idea.content ? (
              <RichTextView html={idea.content} />
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </DetailSection>
          {idea.tags.length > 0 && (
            <DetailSection title="Tags">
              <TagList tags={idea.tags} />
            </DetailSection>
          )}
          <IdeaFormDialog open={editing} onOpenChange={setEditing} idea={idea} />
        </>
      )}
    </DetailPanel>
  )
}
