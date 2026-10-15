import { Link } from '@adonisjs/inertia/react'
import { Minus, Plus } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import { cn, storefront } from '~/lib/styles'
import ImagePlaceholder from './image_placeholder'

export type SearchResultItem = {
  id: string
  title: string
  imageUrl: string | null
  category: string | null
  vendor: string | null
  price: string | null
  compareAtPrice: string | null
  href: string
  quantity: number
  onAdd?: () => void
  onIncrement: () => void
  onDecrement: () => void
}

type SearchResultsProps = {
  id: string
  query: string
  items: SearchResultItem[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  className?: string
}

const stepperButton =
  'grid h-full w-9 flex-none place-items-center transition-colors duration-150 hover:bg-sf-text/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset'

function ResultRow({ item }: { item: SearchResultItem }) {
  const {
    title,
    imageUrl,
    category,
    vendor,
    price,
    compareAtPrice,
    href,
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
  } = item
  const meta = [category, vendor].filter(Boolean).join(' · ')

  return (
    <li className="flex min-w-0 items-center gap-3 px-3 py-2.5">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block size-12 flex-none overflow-hidden rounded-lg"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            width={48}
            height={48}
            className="size-full bg-sf-text/5 object-cover"
          />
        ) : (
          <ImagePlaceholder className="h-full" iconSize={16} />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={href}
          className="truncate rounded-sm text-[14px] font-medium text-sf-text hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          title={title}
        >
          {title}
        </Link>
        {meta && <span className="truncate text-[12px] text-sf-muted">{meta}</span>}
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <span className="text-[13.5px] font-semibold text-sf-primary">{price ?? '—'}</span>
          {compareAtPrice && (
            <span className="text-[12px] text-sf-muted line-through">{compareAtPrice}</span>
          )}
        </span>
      </div>
      {quantity > 0 ? (
        <div
          role="group"
          aria-label={`${title} quantity`}
          className="flex h-9 flex-none items-center overflow-hidden rounded-lg bg-sf-accent text-sf-text"
        >
          <button
            type="button"
            className={stepperButton}
            onClick={onDecrement}
            aria-label={`Decrease quantity of ${title}`}
          >
            <Minus size={15} />
          </button>
          <span
            aria-live="polite"
            className="min-w-6 text-center text-[13.5px] font-medium tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            className={stepperButton}
            onClick={onIncrement}
            aria-label={`Increase quantity of ${title}`}
          >
            <Plus size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            storefront.primaryButton,
            'h-9 flex-none gap-1 px-3 text-[13px] disabled:cursor-not-allowed disabled:opacity-50'
          )}
          onClick={onAdd}
          disabled={!onAdd || price === null}
          aria-label={`Add ${title} to bag`}
        >
          <Plus size={15} className="flex-none" />
          Add
        </button>
      )}
    </li>
  )
}

function ResultSkeleton() {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5" aria-hidden="true">
      <span className="block size-12 flex-none overflow-hidden rounded-lg">
        <Skeleton className="h-full rounded-none" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/5" />
      </div>
      <Skeleton className="h-9 w-16 flex-none rounded-lg" />
    </li>
  )
}

/**
 * Live product search results shown under the storefront search field.
 * Positioned against the nearest `relative` ancestor and scrolls inside
 * itself on short screens.
 */
export default function SearchResults({
  id,
  query,
  items,
  isLoading,
  isError,
  onRetry,
  className,
}: SearchResultsProps) {
  return (
    <div
      id={id}
      role="region"
      aria-label={`Search results for ${query}`}
      className={cn(
        storefront.card,
        'absolute inset-x-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto overscroll-contain shadow-[0_16px_32px_-16px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {isError && !items ? (
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-[14px]">Search is not available right now.</p>
          <button type="button" className={storefront.primaryButton} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : isLoading && !items ? (
        <ul className="divide-y divide-sf-line py-1">
          {Array.from({ length: 3 }, (_, index) => (
            <ResultSkeleton key={index} />
          ))}
        </ul>
      ) : items && items.length > 0 ? (
        <>
          <p className="sr-only" aria-live="polite">
            {items.length} {items.length === 1 ? 'product' : 'products'} found
          </p>
          <ul className="divide-y divide-sf-line py-1">
            {items.map((item) => (
              <ResultRow key={item.id} item={item} />
            ))}
          </ul>
        </>
      ) : (
        <p className="p-5 text-center text-[14px] text-sf-muted" aria-live="polite">
          No products match “{query}”.
        </p>
      )}
    </div>
  )
}
