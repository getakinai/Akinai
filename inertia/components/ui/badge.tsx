import { type ReactNode } from 'react'
import { badgeTones, cn, type BadgeTone } from '~/lib/styles'

type BadgeProps = {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}

export default function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[11.5px] font-medium whitespace-nowrap',
        badgeTones[tone],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
