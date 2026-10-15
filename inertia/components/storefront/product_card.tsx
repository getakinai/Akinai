import type { ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import type { ProductLabelBadgeData } from '~/lib/product_label'
import { cn, storefront } from '~/lib/styles'
import ImagePlaceholder from './image_placeholder'
import LoadingImage from './loading_image'
import ProductLabelBadge from './product_label_badge'

export type ProductCardLayout = 'grid' | 'list'

type ProductCardProps = {
  title: string
  imageUrl?: string | null
  vendor: string | null
  price: string | null
  compareAtPrice: string | null
  label?: ProductLabelBadgeData | null
  href?: string
  quantity?: number
  layout?: ProductCardLayout
  /** Shows the wishlist heart when set. */
  onToggleSave?: () => void
  saved?: boolean
  onAdd?: () => void
  onIncrement?: () => void
  onDecrement?: () => void
  onOpenCart?: () => void
}

type CartControlProps = Pick<
  ProductCardProps,
  'title' | 'price' | 'onAdd' | 'onIncrement' | 'onDecrement' | 'onOpenCart'
> & { quantity: number }

const stepperButton =
  'grid h-full w-9 flex-none place-items-center transition-colors duration-150 hover:bg-sf-text/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset'

function CartControl({
  title,
  price,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onOpenCart,
}: CartControlProps) {
  if (quantity > 0) {
    return (
      <div className="flex h-10 min-w-0 gap-1.5">
        <div
          role="group"
          aria-label={`${title} quantity`}
          className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg bg-sf-accent text-sf-text"
        >
          <button
            type="button"
            className={cn(stepperButton, 'border-r border-sf-text/10')}
            onClick={onDecrement}
            aria-label={`Decrease quantity of ${title}`}
          >
            <Minus size={16} />
          </button>
          <span
            aria-live="polite"
            className="min-w-0 flex-1 truncate px-1 text-center text-[13.5px] font-medium tabular-nums"
          >
            {quantity}
            <span className="hidden min-[400px]:inline"> in Bag</span>
          </span>
          <button
            type="button"
            className={cn(stepperButton, 'border-l border-sf-text/10')}
            onClick={onIncrement}
            aria-label={`Increase quantity of ${title}`}
          >
            <Plus size={16} />
          </button>
        </div>
        {onOpenCart && (
          <button
            type="button"
            className="hidden size-10 flex-none place-items-center rounded-lg bg-sf-accent text-sf-text transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring sm:grid"
            onClick={onOpenCart}
            aria-label="View bag"
          >
            <ShoppingBag size={16} fill="currentColor" />
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        storefront.primaryButton,
        'w-full gap-1.5 px-2 text-[13.5px] disabled:cursor-not-allowed disabled:opacity-50'
      )}
      onClick={onAdd}
      disabled={!onAdd || price === null}
      aria-label={`Add ${title} to bag`}
    >
      <Plus size={16} className="flex-none" />
      <span className="truncate">Add to Bag</span>
    </button>
  )
}

function SaleBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-md bg-sf-accent font-semibold text-sf-text',
        small ? 'px-1.5 text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]'
      )}
    >
      Sale
    </span>
  )
}

function Badges({
  label,
  onSale,
  small = false,
}: {
  label?: ProductLabelBadgeData | null
  onSale: boolean
  small?: boolean
}) {
  if (!label && !onSale) return null
  return (
    <div
      className={cn(
        'pointer-events-none absolute flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1',
        small ? 'top-1.5 left-1.5 max-w-[calc(100%-0.75rem)]' : 'top-2.5 left-2.5'
      )}
    >
      {label && <ProductLabelBadge label={label} small={small} />}
      {onSale && <SaleBadge small={small} />}
    </div>
  )
}

function SaveButton({
  title,
  saved,
  onToggle,
  className,
}: {
  title: string
  saved: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={cn(
        'grid size-9 place-items-center rounded-full bg-sf-surface/90 text-sf-text shadow-sm transition-[color,scale] duration-150 hover:text-sf-primary active:scale-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
        saved && 'text-sf-primary',
        className
      )}
    >
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}

function Price({ price, compareAtPrice }: Pick<ProductCardProps, 'price' | 'compareAtPrice'>) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
      <span className="text-[15px] font-semibold text-sf-primary">{price ?? '—'}</span>
      {compareAtPrice && (
        <span className="text-[12.5px] text-sf-muted line-through">{compareAtPrice}</span>
      )}
    </div>
  )
}

function MaybeLink({
  href,
  className,
  tabIndex,
  children,
}: {
  href?: string
  className?: string
  tabIndex?: number
  children: ReactNode
}) {
  if (!href) return <span className={className}>{children}</span>
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
        className
      )}
    >
      {children}
    </Link>
  )
}

export default function ProductCard({
  title,
  imageUrl,
  vendor,
  price,
  compareAtPrice,
  label,
  href,
  quantity = 0,
  layout = 'grid',
  onToggleSave,
  saved = false,
  onAdd,
  onIncrement,
  onDecrement,
  onOpenCart,
}: ProductCardProps) {
  const control = (
    <CartControl
      title={title}
      price={price}
      quantity={quantity}
      onAdd={onAdd}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
      onOpenCart={onOpenCart}
    />
  )

  if (layout === 'list') {
    return (
      <article
        className={cn(
          storefront.card,
          'flex flex-wrap items-center gap-3 p-3 transition-shadow duration-200 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.25)] sm:gap-4'
        )}
      >
        <MaybeLink
          href={href}
          tabIndex={-1}
          className="relative block size-20 flex-none overflow-hidden rounded-lg bg-white sm:size-24"
        >
          {imageUrl ? (
            <LoadingImage
              src={imageUrl}
              alt={title}
              loading="lazy"
              width={200}
              height={200}
              className="size-full object-cover"
            />
          ) : (
            <ImagePlaceholder className="size-full" iconSize={20} />
          )}
          <Badges label={label} onSale={compareAtPrice !== null} small />
        </MaybeLink>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {vendor && <span className="truncate text-[12px] text-sf-muted">{vendor}</span>}
          <h3
            className="truncate text-[14.5px] leading-snug font-medium text-sf-text"
            title={title}
          >
            <MaybeLink href={href} className="rounded-sm hover:underline">
              {title}
            </MaybeLink>
          </h3>
          <Price price={price} compareAtPrice={compareAtPrice} />
        </div>
        <div className="flex basis-full items-center gap-2 min-[460px]:w-56 min-[460px]:basis-auto">
          <div className="min-w-0 flex-1">{control}</div>
          {onToggleSave && (
            <SaveButton
              title={title}
              saved={saved}
              onToggle={onToggleSave}
              className="size-10 flex-none border border-sf-line"
            />
          )}
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        storefront.card,
        'group flex h-full flex-col overflow-hidden transition-[box-shadow,translate] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.25)]'
      )}
    >
      <div className="relative">
        <MaybeLink href={href} tabIndex={-1} className="block p-3 pb-0 sm:p-3.5 sm:pb-0">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
            {imageUrl ? (
              <LoadingImage
                src={imageUrl}
                alt={title}
                loading="lazy"
                width={600}
                height={600}
                className="size-full object-contain p-3 transition-transform duration-200 motion-safe:group-hover:scale-105 sm:p-4"
              />
            ) : (
              <ImagePlaceholder className="size-full" />
            )}
            <Badges label={label} onSale={compareAtPrice !== null} />
          </div>
        </MaybeLink>
        {onToggleSave && (
          <SaveButton
            title={title}
            saved={saved}
            onToggle={onToggleSave}
            className="absolute top-4.5 right-4.5 sm:top-5 sm:right-5"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        {vendor && <span className="truncate text-[12px] text-sf-muted">{vendor}</span>}
        <h3 className="truncate text-[14px] leading-snug font-medium text-sf-text" title={title}>
          <MaybeLink href={href} className="rounded-sm hover:underline">
            {title}
          </MaybeLink>
        </h3>
        <div className="mt-auto pt-2">
          <Price price={price} compareAtPrice={compareAtPrice} />
        </div>
        <div className="mt-2.5">{control}</div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton({ layout = 'grid' }: { layout?: ProductCardLayout }) {
  if (layout === 'list') {
    return (
      <div className={cn(storefront.card, 'flex items-center gap-3 p-3 sm:gap-4')}>
        <div className="size-20 flex-none overflow-hidden rounded-lg sm:size-24">
          <ImagePlaceholder className="size-full" loading />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="w-1/4" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(storefront.card, 'flex flex-col overflow-hidden')}>
      <div className="p-3 pb-0 sm:p-3.5 sm:pb-0">
        <ImagePlaceholder className="aspect-square rounded-lg" loading />
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        <Skeleton className="w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <Skeleton className="mt-1 h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}
