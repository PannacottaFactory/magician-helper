import { useEffect } from 'react'
import { DEFAULT_TITLE, SITE_NAME } from '@/features/public/seo'

/** Sets the browser tab title ("Tricks · Magician Helper"). */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE
  }, [title])
}
