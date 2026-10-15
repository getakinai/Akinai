import { cn } from '~/lib/styles'

type AvatarProps = {
  initials?: string
  size?: 'sm' | 'md' | 'lg'
  seed?: string
  className?: string
}

const sizes = {
  sm: 'size-8 text-[11.5px]',
  md: 'size-9 text-[12.5px]',
  lg: 'size-12 text-[14px]',
}

const gradients = [
  'from-accent to-purple',
  'from-ok to-info',
  'from-warning to-danger',
  'from-info to-accent',
  'from-purple to-danger',
  'from-ok to-accent',
]

function gradientFor(seed?: string) {
  if (!seed) return gradients[0]
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return gradients[hash % gradients.length]
}

/**
 * Initials avatar. Pass a `seed` (such as a record id) to pick a stable
 * gradient per record.
 */
export default function Avatar({ initials, size = 'md', seed, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold tracking-[0.02em] text-paper',
        gradientFor(seed),
        sizes[size],
        className
      )}
    >
      {initials ?? '…'}
    </span>
  )
}
