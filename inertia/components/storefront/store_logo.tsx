import { Link } from '@adonisjs/inertia/react'
import Logo from '~/components/logo'
import { Skeleton } from '~/components/ui'
import { cn } from '~/lib/styles'

type StoreLogoProps = {
  logoUrl: string | null | undefined
  storeName: string
  size?: number
  variant?: 'default' | 'large'
  loading?: boolean
  className?: string
  /** When false, do not wrap in a home link (parent already links home). */
  linkHome?: boolean
}

const variants = {
  default: {
    skeleton: 'h-8 w-8',
    image: 'h-8 max-w-[140px] sm:max-w-[180px]',
  },
  large: {
    skeleton: 'h-12 w-12 sm:h-16 sm:w-16',
    image: 'h-12 max-w-[180px] sm:h-16 sm:max-w-[300px]',
  },
}

/**
 * The uploaded store logo linking home, or the default mark when none is
 * uploaded. Shows a placeholder while the theme loads so the default mark
 * does not flash before the uploaded logo.
 */
export default function StoreLogo({
  logoUrl,
  storeName,
  size = 28,
  variant = 'default',
  loading = false,
  className,
  linkHome = true,
}: StoreLogoProps) {
  const styles = variants[variant]
  if (loading) return <Skeleton className={cn('shrink-0 rounded-lg', styles.skeleton)} />
  if (!logoUrl) return <Logo size={size} linked={linkHome} />

  if (!linkHome) {
    return (
      <img
        src={logoUrl}
        alt={storeName}
        className={cn('w-auto object-contain', styles.image, className)}
      />
    )
  }

  return (
    <Link route="home" aria-label={storeName} className={cn('inline-flex min-w-0', className)}>
      <img src={logoUrl} alt={storeName} className={cn('w-auto object-contain', styles.image)} />
    </Link>
  )
}
