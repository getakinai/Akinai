import { ArrowRight } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import { cn, storefront } from '~/lib/styles'
import LoadingImage from './loading_image'

type PromoBannerProps = {
  eyebrow: string | null
  title: string
  buttonLabel: string | null
  href: string
  isExternal?: boolean
  imageUrl?: string | null
  tone?: 'primary' | 'accent'
  className?: string
}

/**
 * One promo banner. The whole banner is a link; the image circle only
 * shows when an image is set.
 */
export default function PromoBanner({
  eyebrow,
  title,
  buttonLabel,
  href,
  isExternal = false,
  imageUrl = null,
  tone = 'primary',
  className,
}: PromoBannerProps) {
  const isPrimary = tone === 'primary'

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className={cn(
        'grid min-w-0 items-center gap-4 overflow-hidden rounded-card p-5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring sm:p-6',
        imageUrl ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1',
        isPrimary ? 'bg-sf-primary text-sf-primary-fg' : 'bg-sf-accent-soft text-sf-text',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <span
            className={cn(
              'text-[12px] font-semibold tracking-[0.08em] uppercase',
              isPrimary ? 'text-sf-accent' : 'text-sf-primary'
            )}
          >
            {eyebrow}
          </span>
        )}
        <p className="mt-1.5 text-[19px] leading-tight font-semibold tracking-[-0.015em] text-balance sm:text-[22px]">
          {title}
        </p>
        <span
          className={cn(
            'mt-4 w-fit',
            isPrimary ? storefront.accentButton : storefront.primaryButton
          )}
        >
          {buttonLabel || 'Shop now'} <ArrowRight size={15} />
        </span>
      </div>
      {imageUrl && (
        <LoadingImage
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-24 rounded-full object-cover sm:size-32"
        />
      )}
    </a>
  )
}

export function PromoBannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-card bg-sf-line/45 p-5 sm:p-6',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2.5">
        <Skeleton className="w-20" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="mt-2 h-10 w-28 rounded-lg" />
      </div>
      <Skeleton className="size-24 rounded-full sm:size-32" />
    </div>
  )
}
