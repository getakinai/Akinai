import { ImageIcon } from 'lucide-react'
import { cn } from '~/lib/styles'

/**
 * Stand-in for a product or banner photo. Pulses only while `loading`.
 */
export default function ImagePlaceholder({
  className,
  loading = false,
  iconSize = 22,
}: {
  className?: string
  loading?: boolean
  iconSize?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid w-full place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--sf-line),color-mix(in_oklab,var(--sf-line)_45%,var(--sf-surface)))] text-sf-muted/50',
        loading && 'motion-safe:animate-pulse',
        className
      )}
    >
      {!loading && <ImageIcon size={iconSize} strokeWidth={1.5} />}
    </span>
  )
}
