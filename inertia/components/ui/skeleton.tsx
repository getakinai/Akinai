import { cn } from '~/lib/styles'

export default function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-3 rounded bg-line motion-safe:animate-pulse', className)}
    />
  )
}
