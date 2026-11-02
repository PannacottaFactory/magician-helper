import { useMemo, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Lightbulb, Plus, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { TagBadge } from '@/components/common/tag-badge'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { formatRelative, htmlToText, pluralize } from '@/lib/format'
import { useIdeas } from './api'
import { IdeaFormDialog } from './idea-form-dialog'

export function IdeasPage() {
  const { data, isLoading } = useIdeas()
  const ideas = useWithoutPending(data)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('all')
  const [creating, setCreating] = useState(false)

  const withText = useMemo(() => ideas.map((idea) => ({ ...idea, text: htmlToText(idea.content) })), [ideas])
  const allTags = useMemo(() => [...new Set(ideas.flatMap((i) => i.tags))].sort((a, b) => a.localeCompare(b)), [ideas])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return withText.filter(
      (idea) =>
        (tag === 'all' || idea.tags.includes(tag)) &&
        (!q || idea.title.toLowerCase().includes(q) || idea.text.toLowerCase().includes(q)),
    )
  }, [withText, search, tag])

  return (
    <>
      <PageHeader
        title="Ideas"
        description={ideas.length ? pluralize(ideas.length, 'idea') : 'Your notebook for future magic.'}
        actions={
          <WriteButton onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> New idea
          </WriteButton>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Capture plots, presentations and patter lines the moment they appear — then turn the best ones into tricks."
          action={
            <WriteButton onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" /> Capture an idea
            </WriteButton>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search ideas…" className="sm:w-72" />
            {allTags.length > 0 && (
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="sm:w-44" aria-label="Filter by tag">
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
          </Toolbar>
          <ResultCount shown={filtered.length} total={ideas.length} noun="ideas" />
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No ideas match your search.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((idea) => (
                <Card key={idea.id} className="group relative gap-2 p-4 transition-colors hover:border-gold/40">
                  <Link
                    to={idea.id}
                    className="font-display text-lg leading-tight font-semibold after:absolute after:inset-0 focus-visible:outline-none group-focus-within:text-gold"
                  >
                    {idea.title}
                  </Link>
                  {idea.text && <p className="line-clamp-4 text-sm text-muted-foreground">{idea.text}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    {idea.trick && (
                      <Badge variant="outline" className="gap-1 border-gold/40 text-gold">
                        <Sparkles className="size-3" aria-hidden="true" /> {idea.trick.name}
                      </Badge>
                    )}
                    {idea.tags.map((t) => (
                      <TagBadge key={t} tag={t} />
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">{formatRelative(idea.updated_at)}</span>
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-ring group-has-[a:focus-visible]:ring-2" aria-hidden="true" />
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <IdeaFormDialog open={creating} onOpenChange={setCreating} />
      <Outlet />
    </>
  )
}
