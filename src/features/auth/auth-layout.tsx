import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/common/logo'
import { useDocumentTitle } from '@/hooks/use-document-title'

type AuthLayoutProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  useDocumentTitle(title)
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* soft gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />
      <Link to="/" className="relative mb-8 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Wordmark />
      </Link>
      <main className="relative w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/20 sm:p-8">
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </main>
    </div>
  )
}
