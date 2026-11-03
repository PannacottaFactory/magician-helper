import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const asset = (file: string) => `${import.meta.env.BASE_URL}landing/${file}`

/* ---------------------------------------------------------------------------
 * Scroll reveal: fades and lifts its content in the first time it enters the
 * viewport. Reduced motion is handled globally (transitions become instant).
 * ------------------------------------------------------------------------- */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || shown) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shown])

  return (
    <Tag
      ref={ref}
      data-shown={shown}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'translate-y-6 opacity-0 transition-[opacity,translate] duration-700 ease-out data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/* ---------------------------------------------------------------------------
 * Device frames around real screenshots of the app
 * ------------------------------------------------------------------------- */
export function LaptopFrame({ src, alt, eager, className }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="mx-auto w-[92%] rounded-t-xl border border-foreground/10 bg-card-back p-[1.4%] pb-[1.8%] shadow-2xl shadow-black/40">
        <img
          src={asset(src)}
          alt={alt}
          width={1920}
          height={1200}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full rounded-[3px]"
        />
      </div>
      <div aria-hidden="true" className="relative h-3 rounded-b-xl border border-t-0 border-foreground/10 bg-gradient-to-b from-muted to-border sm:h-4">
        <span className="absolute top-0 left-1/2 h-1.5 w-1/6 -translate-x-1/2 rounded-b-md bg-background/60" />
      </div>
    </div>
  )
}

export function PhoneFrame({ src, alt, eager, className }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={cn('relative rounded-[13%/6%] border border-foreground/15 bg-card-back p-[4%] shadow-2xl shadow-black/50', className)}>
      <span aria-hidden="true" className="absolute top-[3.2%] left-1/2 z-10 h-[2.4%] w-[28%] -translate-x-1/2 rounded-full bg-card-back" />
      <img
        src={asset(src)}
        alt={alt}
        width={780}
        height={1688}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="block h-auto w-full rounded-[10%/4.6%]"
      />
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Card fan with one secret card: hover (or tap / Enter) turns it over.
 * ------------------------------------------------------------------------- */
const FAN = [-24, -10, 4]
const SECRET_ANGLE = 18

function cardStyle(angle: number, index: number): CSSProperties {
  return { '--fan-angle': `${angle}deg`, animationDelay: `${450 + index * 110}ms` } as CSSProperties
}

const fanCard =
  'absolute bottom-0 left-1/2 -ml-[38px] h-[108px] w-[76px] origin-[50%_115%] animate-[fan-out_0.9s_cubic-bezier(0.2,0.8,0.2,1)_both]'

function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn('size-full rounded-lg border border-gold/30 bg-card-back p-1.5 shadow-lg shadow-black/40', className)}
      aria-hidden="true"
    >
      <div
        className="size-full rounded-[5px] border border-gold/25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, color-mix(in oklab, var(--gold) 22%, transparent) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, color-mix(in oklab, var(--gold) 22%, transparent) 0 1px, transparent 1px 7px)',
        }}
      />
    </div>
  )
}

function Spade({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2c-1.2 2.4-3.6 4.3-5.9 6.1C4.4 9.4 3 10.9 3 13.2 3 15.8 5 17.6 7.3 17.6c1.4 0 2.6-.6 3.4-1.6-.3 2.2-1.1 3.7-2.7 4.9V22h8v-1.1c-1.6-1.2-2.4-2.7-2.7-4.9.8 1 2 1.6 3.4 1.6 2.3 0 4.3-1.8 4.3-4.4 0-2.3-1.4-3.8-3.1-5.1C15.6 6.3 13.2 4.4 12 2z"
      />
    </svg>
  )
}

export function CardFan({ className }: { className?: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={cn('relative h-[150px] w-[170px]', className)}>
      {FAN.map((angle, i) => (
        <div key={angle} className={fanCard} style={cardStyle(angle, i)}>
          <CardBack />
        </div>
      ))}
      <div className={fanCard} style={cardStyle(SECRET_ANGLE, FAN.length)}>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          aria-label="Secret card: turn it over"
          className="group size-full cursor-pointer rounded-lg perspective-[700px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <span
            className={cn(
              'relative block size-full transition-transform duration-700 ease-out transform-3d group-hover:-translate-y-1.5 group-hover:rotate-y-180',
              revealed && 'rotate-y-180',
            )}
          >
            <span className="absolute inset-0 backface-hidden">
              <CardBack className="border-gold/50" />
            </span>
            <span className="absolute inset-0 flex flex-col rounded-lg border border-gold/40 bg-card-face p-1.5 text-card-ink shadow-lg shadow-black/40 backface-hidden rotate-y-180">
              <span className="flex flex-col items-center self-start font-display text-sm leading-none font-bold">
                A<Spade className="mt-0.5 size-2.5" />
              </span>
              <span className="flex flex-1 flex-col items-center justify-center gap-1">
                <Spade className="size-7 text-gold-deep" />
                <span className="font-display text-[10px] leading-tight font-semibold italic">Your secret</span>
              </span>
              <span className="flex rotate-180 flex-col items-center self-end font-display text-sm leading-none font-bold">
                A<Spade className="mt-0.5 size-2.5" />
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
