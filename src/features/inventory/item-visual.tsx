import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CatalogIllustration } from './catalog/illustrations'

/** Item picture: uploaded photo, else catalog illustration, else a placeholder. */
export function ItemVisual({
  photoUrl,
  catalogKey,
  className,
}: {
  photoUrl?: string | null
  catalogKey?: string | null
  className?: string
}) {
  if (photoUrl) return <img src={photoUrl} alt="" className={cn('object-cover', className)} loading="lazy" />
  if (catalogKey) return <CatalogIllustration catalogKey={catalogKey} className={className} />
  return (
    <div className={cn('flex items-center justify-center bg-muted', className)}>
      <ImageOff className="size-1/4 max-h-6 max-w-6 text-muted-foreground/50" aria-hidden="true" />
    </div>
  )
}
