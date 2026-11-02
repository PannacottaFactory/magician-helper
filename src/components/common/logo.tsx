import { cn } from '@/lib/utils'

/** Top-hat mark. The hat follows the text color, the band and sparkle are gold. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <path d="M10.5 8h11l.5 13h-12z" fill="currentColor" />
      <rect x="10.2" y="17" width="11.6" height="2.4" className="fill-gold" />
      <path
        d="M5.5 22.5c0-.8.7-1.5 1.5-1.5h18c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H7c-.8 0-1.5-.7-1.5-1.5z"
        fill="currentColor"
      />
      <path d="M25.5 4.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" className="fill-gold" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <Logo className="size-7" />
      <span className="font-display text-xl font-semibold tracking-wide">
        Magician <span className="text-gold">Helper</span>
      </span>
    </span>
  )
}
