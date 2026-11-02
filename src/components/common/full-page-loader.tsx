import { Logo } from './logo'

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Logo className="size-10 animate-pulse" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}
