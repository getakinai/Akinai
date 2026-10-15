import { Link } from '@adonisjs/inertia/react'
import type { FeatureIcon as FeatureIconName } from '~/lib/storefront'
import { cn, storefront } from '~/lib/styles'
import { Skeleton } from '~/components/ui'
import FeatureIcon from './feature_icon'

export type FeatureTile = {
  id: string
  icon: FeatureIconName
  title: string
  text: string
  href?: string
}

type FeatureTilesProps = {
  items: FeatureTile[]
  label?: string
  className?: string
}

const grid = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'

const tile = cn(storefront.card, 'flex min-w-0 items-start gap-3 p-4')

export default function FeatureTiles({
  items,
  label = 'Why shop with us',
  className,
}: FeatureTilesProps) {
  return (
    <section className={cn(grid, className)} aria-label={label}>
      {items.map(({ id, icon, title, text, href }) => {
        const content = (
          <>
            <span className="grid size-10 flex-none place-items-center rounded-lg bg-sf-primary-soft text-sf-primary">
              <FeatureIcon name={icon} />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold break-words">{title}</div>
              <p className="text-[13px] break-words text-sf-muted">{text}</p>
            </div>
          </>
        )
        return href ? (
          <Link
            key={id}
            href={href}
            className={cn(
              tile,
              'transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'
            )}
          >
            {content}
          </Link>
        ) : (
          <div key={id} className={tile}>
            {content}
          </div>
        )
      })}
    </section>
  )
}

export function FeatureTilesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(grid, className)} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[74px] w-full rounded-card" />
      ))}
    </div>
  )
}
