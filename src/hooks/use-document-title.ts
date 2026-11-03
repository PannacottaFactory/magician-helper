import { useEffect } from 'react'

const APP = 'Magician Helper'

/** Sets the browser tab title ("Tricks · Magician Helper"). */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP}` : `${APP} — Your magic, organized`
  }, [title])
}
