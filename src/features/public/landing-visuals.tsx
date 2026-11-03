import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
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
      <div className="mx-auto w-[92%] rounded-t-xl border border-foreground/10 bg-device-frame p-[1.4%] pb-[1.8%] shadow-2xl shadow-black/40">
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
    <div className={cn('relative rounded-[13%/6%] border border-foreground/15 bg-device-frame p-[4%] shadow-2xl shadow-black/50', className)}>
      <span aria-hidden="true" className="absolute top-[3.2%] left-1/2 z-10 h-[2.4%] w-[28%] -translate-x-1/2 rounded-full bg-device-frame" />
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
