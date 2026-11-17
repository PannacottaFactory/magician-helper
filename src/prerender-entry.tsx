// Server-side entry used only at build time by scripts/prerender.mjs: renders the
// public pages to HTML so search engines can read them without JavaScript.
// Components rendered here must not touch `window`/`document` during render.
import type { ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/auth-provider'
import { LandingPage } from '@/features/public/landing-page'
import { GuidePage, GuidesIndexPage } from '@/features/public/guides/guide-pages'
import { GUIDES, GUIDES_PATH, guidePath } from '@/features/public/guides/guides-meta'
import { PrivacyPage, TermsPage } from '@/features/public/legal-pages'
import { OrganizerPage } from '@/features/public/organizer-page'
import { ORGANIZER_PATH } from '@/features/public/seo'
import { env } from '@/lib/env'

export { PUBLIC_PAGES, SITE_URL, pageUrl, structuredData } from '@/features/public/seo'
export const priceLabel = env.priceLabel
export const basePath = import.meta.env.BASE_URL

const PAGES: Record<string, ComponentType> = {
  '/': LandingPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
  [ORGANIZER_PATH]: OrganizerPage,
  [GUIDES_PATH]: GuidesIndexPage,
  ...Object.fromEntries(GUIDES.map((g) => [guidePath(g.slug), () => <GuidePage slug={g.slug} />])),
}

export function render(path: string): string {
  const Page = PAGES[path]
  if (!Page) throw new Error(`No prerender component for ${path}`)
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <StaticRouter location={basename + path} basename={basename || '/'}>
          <Page />
        </StaticRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}
