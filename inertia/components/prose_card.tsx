import { type ReactNode } from 'react'
import { cn } from '~/lib/styles'

/**
 * The centered marketing card with a status line on top. Direct children
 * rise in one after another.
 */
export default function ProseCard({
  status,
  statusClassName,
  children,
}: {
  status: ReactNode
  statusClassName?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-[104px] pb-14 max-[720px]:pt-[92px] sm:px-6">
      <article className="w-[580px] max-w-full rounded-card border border-line-2 bg-card px-[46px] pt-[42px] pb-6 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_36px_70px_-46px_rgba(10,10,11,0.45)] motion-safe:*:animate-chunk-rise motion-safe:*:nth-2:[animation-delay:100ms] motion-safe:*:nth-3:[animation-delay:200ms] motion-safe:*:nth-4:[animation-delay:300ms] motion-safe:*:nth-5:[animation-delay:400ms] motion-safe:*:nth-6:[animation-delay:500ms] max-[880px]:px-7 max-[880px]:pt-[34px] max-[880px]:pb-5 dark:shadow-[0_36px_80px_-50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-line pb-[22px]">
          <span
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.09em] uppercase',
              statusClassName
            )}
          >
            <span className="relative size-[7px] rounded-full border-[1.5px] border-current after:absolute after:inset-[1.5px] after:rounded-full after:bg-current" />
            {status}
          </span>
        </div>
        {children}
      </article>
    </div>
  )
}

export function ProseLead({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[26px] flex flex-col font-serif text-[34px] leading-[1.12] font-normal tracking-[0.2px] text-balance max-[880px]:text-[30px]">
      {children}
    </div>
  )
}

export function ProseParagraph({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[14px] leading-[1.6] text-pretty text-ink-2">{children}</p>
}
