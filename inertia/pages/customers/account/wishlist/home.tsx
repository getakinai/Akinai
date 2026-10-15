import { Link } from '@adonisjs/inertia/react'
import { Heart } from 'lucide-react'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import { useStoreMoney } from '../../../_hooks'
import ProductGrid, { ProductGridSkeleton } from '../../../_product_grid'
import AccountPage, { EmptyState, ErrorState } from '../_account_page'
import { useWishlist } from './_hooks'

export default function CustomerAccountWishlistHome() {
  const wishlist = useWishlist()
  const money = useStoreMoney()
  const products = wishlist.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <AccountPage
      title="Wishlist"
      description="Products you saved. Tap the heart on a product to add or remove it."
    >
      {wishlist.isLoading && <ProductGridSkeleton count={3} columns={3} />}
      {wishlist.isError && (
        <ErrorState message="We couldn’t load your wishlist." onRetry={() => wishlist.refetch()} />
      )}
      {wishlist.data && products.length === 0 && (
        <EmptyState icon={<Heart size={20} />} title="Your wishlist is empty">
          <p>Tap the heart on any product to save it here for later.</p>
          <Link route="home" className="mt-2 font-medium text-sf-primary hover:underline">
            Start shopping
          </Link>
        </EmptyState>
      )}
      {products.length > 0 && <ProductGrid products={products} money={money} columns={3} />}
      {wishlist.hasNextPage && (
        <button
          type="button"
          onClick={() => wishlist.fetchNextPage()}
          disabled={wishlist.isFetchingNextPage}
          className={cn(
            storefront.iconButton,
            'h-10 w-full px-4 text-[14px] font-medium disabled:opacity-55 sm:w-fit sm:self-center'
          )}
        >
          {wishlist.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      )}
    </AccountPage>
  )
}

CustomerAccountWishlistHome.layout = [StorefrontLayout, AccountLayout]
