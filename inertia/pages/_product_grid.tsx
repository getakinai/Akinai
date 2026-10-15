import { useCart } from 'snappycart'
import { ProductCard, ProductCardSkeleton, type ProductCardLayout } from '~/components/storefront'
import { useCartDrawer } from '~/hooks/use_cart_drawer'
import { useWishlistToggle } from '~/hooks/use_wishlist'
import { trackEvent } from '~/lib/analytics'
import { formatMoney, type MoneyFormat } from '~/lib/money'
import { productHref } from '~/lib/product_link'
import { cn } from '~/lib/styles'
import type { StorefrontProductCard } from './_types'

/** Grid cards per row from the `lg` breakpoint. */
export type ProductGridColumns = 3 | 4

const GRID_COLUMNS: Record<ProductGridColumns, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

function layoutClasses(layout: ProductCardLayout, columns: ProductGridColumns) {
  return layout === 'grid'
    ? cn('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3', GRID_COLUMNS[columns])
    : 'flex flex-col gap-3'
}

type ProductGridProps = {
  products: StorefrontProductCard[]
  money: MoneyFormat
  layout?: ProductCardLayout
  columns?: ProductGridColumns
  /** Slug of the collection being browsed, for the product page breadcrumb. */
  collectionSlug?: string
}

/**
 * Storefront product cards wired to the cart: add, change quantity and
 * open the bag. Cart lines are keyed by variant id; cards add the
 * cheapest variant.
 */
export default function ProductGrid({
  products,
  money,
  layout = 'grid',
  columns = 4,
  collectionSlug,
}: ProductGridProps) {
  const { items, addItem, increment, decrement } = useCart()
  const { openCart } = useCartDrawer()
  const wishlist = useWishlistToggle()
  const quantities = new Map(items.map((line) => [line.product.id, line.quantity]))
  const format = (amount: number | null) => (amount === null ? null : formatMoney(amount, money))

  const addToCart = (product: StorefrontProductCard) => {
    if (product.price === null || product.variantId === null) return
    addItem({
      id: product.variantId,
      name: product.title,
      price: product.price,
      imageUrl: product.imageUrl ?? undefined,
      metadata: { slug: product.slug, vendor: product.vendor, variantId: product.variantId },
    })
    trackEvent('add_to_cart', { productId: product.id })
  }

  return (
    <ul className={layoutClasses(layout, columns)}>
      {products.map((product) => {
        const lineId = product.variantId
        return (
          <li key={product.id} className="min-w-0">
            <ProductCard
              layout={layout}
              title={product.title}
              imageUrl={product.imageUrl}
              vendor={product.vendor}
              price={format(product.price)}
              compareAtPrice={format(product.compareAtPrice)}
              label={product.label}
              saved={wishlist.isSaved(product.id)}
              onToggleSave={() => wishlist.toggle(product.id)}
              href={productHref(product.slug, collectionSlug)}
              quantity={lineId === null ? 0 : (quantities.get(lineId) ?? 0)}
              onAdd={
                product.price === null || lineId === null ? undefined : () => addToCart(product)
              }
              onIncrement={() => lineId !== null && increment(lineId)}
              onDecrement={() => lineId !== null && decrement(lineId)}
              onOpenCart={openCart}
            />
          </li>
        )
      })}
    </ul>
  )
}

export function ProductGridSkeleton({
  count,
  layout = 'grid',
  columns = 4,
  className,
}: {
  count: number
  layout?: ProductCardLayout
  columns?: ProductGridColumns
  className?: string
}) {
  return (
    <div className={cn(layoutClasses(layout, columns), className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} layout={layout} />
      ))}
    </div>
  )
}
