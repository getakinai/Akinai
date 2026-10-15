import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ChevronDown, ChevronRight, Heart, Minus, Plus } from 'lucide-react'
import { useCart } from 'snappycart'
import { ImagePlaceholder } from '~/components/storefront'
import { Skeleton } from '~/components/ui'
import { useCartDrawer } from '~/hooks/use_cart_drawer'
import { useWishlistToggle } from '~/hooks/use_wishlist'
import StorefrontLayout from '~/layouts/storefront'
import { trackEvent } from '~/lib/analytics'
import { HttpError } from '~/lib/http'
import { formatMoney } from '~/lib/money'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { cn, storefront } from '~/lib/styles'
import {
  useStoreMarket,
  useStoreMoney,
  useStoreTaxNote,
  useStorefrontCollection,
  useStorefrontProduct,
} from '../_hooks'
import type {
  StorefrontPrefetchProps,
  StorefrontProduct,
  StorefrontProductVariant,
} from '../_types'
import Gallery from './_gallery'
import Reviews, { RatingSummaryLink } from './_reviews'

const MAX_QUANTITY = 99

const stepperButton =
  'grid h-full w-10 flex-none place-items-center transition-colors duration-150 hover:bg-sf-text/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40'

/**
 * The variant matching every chosen value, or else the first variant with
 * the value just picked, so a click always lands on a buyable variant.
 */
function pickVariant(
  variants: StorefrontProductVariant[],
  chosen: (string | null)[],
  optionIndex: number
) {
  return (
    variants.find((variant) =>
      variant.optionValues.every((value, index) => value === chosen[index])
    ) ?? variants.find((variant) => variant.optionValues[optionIndex] === chosen[optionIndex])
  )
}

function Breadcrumb({
  title,
  loading,
  collectionSlug,
}: {
  title: string | undefined
  loading: boolean
  collectionSlug: string | null
}) {
  const collectionQuery = useStorefrontCollection(collectionSlug ?? '', {
    enabled: collectionSlug !== null,
  })
  const collection = collectionQuery.data

  return (
    <nav aria-label="Breadcrumb" className="mt-5 sm:mt-7">
      <ol className="flex min-w-0 items-center gap-1 text-[13px] text-sf-muted">
        <li className="flex-none">
          <Link route="home" className="hover:text-sf-text hover:underline">
            Home
          </Link>
        </li>
        {collectionSlug && collectionQuery.isLoading && (
          <>
            <li aria-hidden="true" className="flex-none">
              <ChevronRight size={14} />
            </li>
            <li className="flex-none">
              <Skeleton className="h-3.5 w-20" />
            </li>
          </>
        )}
        {collectionSlug && collection && (
          <>
            <li aria-hidden="true" className="flex-none">
              <ChevronRight size={14} />
            </li>
            <li className="min-w-0 truncate">
              <Link
                route="storefront.collections.show"
                routeParams={{ slug: collection.slug }}
                className="hover:text-sf-text hover:underline"
              >
                {collection.title}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden="true" className="flex-none">
          <ChevronRight size={14} />
        </li>
        <li className="min-w-0 truncate text-sf-text" aria-current="page">
          {title ?? (loading ? <Skeleton className="h-3.5 w-32" /> : 'Product')}
        </li>
      </ol>
    </nav>
  )
}

function NotAvailable() {
  return (
    <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
      <p className="text-[16px] font-semibold">This product is not available</p>
      <p className="mt-1 text-[14px] text-sf-muted">It may have been moved or is no longer sold.</p>
      <Link route="home" className={cn(storefront.primaryButton, 'mt-4')}>
        Back to shop
      </Link>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10" aria-hidden="true">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:items-start">
        <ImagePlaceholder className="aspect-square min-w-0 flex-1 rounded-card" loading />
        <div className="flex gap-2 overflow-hidden lg:w-20 lg:flex-none lg:flex-col">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-16 flex-none rounded-lg lg:size-20" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-col">
        <Skeleton className="w-24" />
        <Skeleton className="mt-2 h-8 w-4/5" />
        <Skeleton className="mt-3 h-4 w-28" />
        <Skeleton className="mt-4 h-6 w-32" />
        <Skeleton className="mt-6 h-4 w-20" />
        <div className="mt-2 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 rounded-full" />
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-11 w-32 flex-none rounded-full" />
          <Skeleton className="h-11 min-w-0 flex-1 rounded-full" />
          <Skeleton className="size-11 flex-none rounded-full" />
        </div>
        <div className="mt-8 flex flex-col gap-2.5 border-t border-sf-line pt-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-full" />
          <Skeleton className="w-full" />
          <Skeleton className="w-3/4" />
        </div>
      </div>
    </div>
  )
}

function ProductDetails({ product }: { product: StorefrontProduct }) {
  const { addItem } = useCart()
  const { openCart } = useCartDrawer()
  const money = useStoreMoney()
  const taxNote = useStoreTaxNote()
  const { data: market } = useStoreMarket()
  const [variantId, setVariantId] = useState(
    () => (product.variants.find(({ price }) => price !== null) ?? product.variants[0]).id
  )
  const [quantity, setQuantity] = useState(1)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const wishlist = useWishlistToggle()
  const saved = wishlist.isSaved(product.id)

  const variant = product.variants.find(({ id }) => id === variantId) ?? product.variants[0]
  const price = variant.price
  const pickerOptions = product.options
    .map((option, index) => ({ ...option, index }))
    .filter((option) => option.values.length > 1)
  const discount =
    variant.compareAtPrice === null || price === null
      ? null
      : Math.round((1 - price / variant.compareAtPrice) * 100)

  const choose = (optionIndex: number, value: string) => {
    const chosen = variant.optionValues.map((current, index) =>
      index === optionIndex ? value : current
    )
    const next = pickVariant(product.variants, chosen, optionIndex)
    if (next) setVariantId(next.id)
  }

  const addToBag = () => {
    if (price === null) return
    addItem(
      {
        id: variant.id,
        name: product.variants.length > 1 ? `${product.title} – ${variant.title}` : product.title,
        price,
        imageUrl: product.images[0],
        metadata: { slug: product.slug, vendor: product.vendor, variantId: variant.id },
      },
      quantity
    )
    trackEvent('add_to_cart', { productId: product.id })
    setQuantity(1)
    openCart()
  }

  useEffect(() => {
    trackEvent('product_view', { productId: product.id })
  }, [product.id])

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
      <Gallery
        key={product.id}
        title={product.title}
        images={product.images}
        onSale={variant.compareAtPrice !== null}
        label={product.label}
      />

      <div className="flex min-w-0 flex-col">
        {product.vendor && (
          <p className="text-[12px] font-medium tracking-[0.08em] text-sf-muted uppercase">
            {product.vendor}
          </p>
        )}
        <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-0.02em] break-words sm:text-[32px]">
          {product.title}
        </h1>
        <RatingSummaryLink slug={product.slug} />

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {price === null ? (
            <span className="text-[15px] font-medium text-sf-muted">
              Not available in {market?.current.name ?? 'your country'}
            </span>
          ) : (
            <>
              <span className="text-[20px] font-semibold text-sf-primary">
                {formatMoney(price, money)}
              </span>
              {variant.compareAtPrice !== null && (
                <span className="text-[14px] text-sf-muted line-through">
                  {formatMoney(variant.compareAtPrice, money)}
                </span>
              )}
              {discount !== null && discount > 0 && (
                <span className="rounded-md bg-sf-accent px-1.5 py-0.5 text-[12px] font-semibold text-sf-text">
                  {discount}% off
                </span>
              )}
              {taxNote && <span className="text-[12.5px] text-sf-muted">{taxNote}</span>}
            </>
          )}
        </div>

        {pickerOptions.map((option) => (
          <fieldset key={option.name} className="mt-5 min-w-0">
            <legend className="mb-2 text-[13.5px] font-medium text-sf-text">
              {option.name}:{' '}
              <span className="font-normal text-sf-muted">
                {variant.optionValues[option.index]}
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
              {option.values.map((value) => {
                const selected = variant.optionValues[option.index] === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(option.index, value)}
                    className={cn(
                      'h-10 min-w-0 truncate rounded-full border px-3 text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                      selected
                        ? 'border-sf-primary bg-sf-primary-soft font-medium text-sf-text'
                        : 'border-sf-line bg-sf-surface text-sf-text hover:bg-sf-primary-soft'
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 flex min-w-0 gap-2">
          <div
            role="group"
            aria-label="Quantity"
            className="flex h-11 flex-none items-center overflow-hidden rounded-full border border-sf-line bg-sf-surface text-sf-text"
          >
            <button
              type="button"
              className={stepperButton}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center text-[14px] font-medium tabular-nums"
            >
              {quantity}
            </span>
            <button
              type="button"
              className={stepperButton}
              onClick={() => setQuantity((current) => Math.min(MAX_QUANTITY, current + 1))}
              disabled={quantity >= MAX_QUANTITY}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            className={cn(
              storefront.primaryButton,
              'h-11 min-w-0 flex-1 rounded-full text-[14px] font-semibold tracking-[0.04em] uppercase'
            )}
            onClick={addToBag}
            disabled={price === null}
          >
            <span className="truncate">{price === null ? 'Unavailable' : 'Add to Bag'}</span>
          </button>
          <button
            type="button"
            onClick={() => wishlist.toggle(product.id)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={cn(
              'grid size-11 flex-none place-items-center rounded-full border border-sf-line bg-sf-surface transition-[color,scale] duration-150 hover:text-sf-primary active:scale-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
              saved ? 'text-sf-primary' : 'text-sf-text'
            )}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {product.description && (
          <section className="mt-8 border-t border-sf-line pt-4">
            <h2>
              <button
                type="button"
                aria-expanded={detailsOpen}
                aria-controls="product-details"
                onClick={() => setDetailsOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md py-1 text-left text-[14.5px] font-medium text-sf-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                Details
                <ChevronDown
                  size={18}
                  className={cn('transition-transform duration-200', detailsOpen && 'rotate-180')}
                />
              </button>
            </h2>
            {detailsOpen && (
              <div
                id="product-details"
                className={cn(storefront.richText, 'mt-2 text-[14px]')}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default function ProductShow({
  slug,
  collection,
}: StorefrontPrefetchProps & {
  slug: string
  collection: string | null
}) {
  const productQuery = useStorefrontProduct(slug)
  const product = productQuery.data
  const notFound = productQuery.error instanceof HttpError && productQuery.error.status === 404

  return (
    <>
      <Head title={product?.seoTitle || product?.title || 'Product'} />
      <div className={cn(storefront.container, 'pb-4')}>
        <Breadcrumb
          title={product?.title}
          loading={productQuery.isLoading}
          collectionSlug={collection}
        />

        {notFound ? (
          <NotAvailable />
        ) : productQuery.isLoading ? (
          <ProductSkeleton />
        ) : productQuery.isError ? (
          <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
            <p className="text-[15px] font-medium">We could not load this product right now.</p>
            <button
              type="button"
              className={cn(storefront.primaryButton, 'mt-4')}
              onClick={() => productQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          product && (
            <>
              <ProductDetails key={product.id} product={product} />
              <Reviews slug={product.slug} />
            </>
          )
        )}
      </div>
    </>
  )
}

ProductShow.layout = [StorefrontLayout]
