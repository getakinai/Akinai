import { Link } from '@adonisjs/inertia/react'
import { ShoppingBag } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import { useCustomerOrders } from '../../_hooks'
import AccountPage, { EmptyState, ErrorState } from '../_account_page'
import { useAccountFormat } from '../_format'
import OrderCard from '../_order_card'

export default function CustomerAccountOrdersHome() {
  const orders = useCustomerOrders()
  const format = useAccountFormat()
  const list = orders.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <AccountPage
      title="Orders"
      description="Every order you’ve placed, newest first."
      actions={
        list.length > 0 && (
          <Link route="home" className={storefront.primaryButton}>
            Continue shopping
          </Link>
        )
      }
    >
      {orders.isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[120px] w-full rounded-card sm:h-[96px]" />
          ))}
        </div>
      )}
      {orders.isError && (
        <ErrorState message="We couldn’t load your orders." onRetry={() => orders.refetch()} />
      )}
      {orders.data && list.length === 0 && (
        <EmptyState icon={<ShoppingBag size={20} />} title="No orders yet">
          <p>When you place an order, it will show up here.</p>
          <Link route="home" className={cn(storefront.primaryButton, 'mt-3')}>
            Start shopping
          </Link>
        </EmptyState>
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-3">
          {list.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              total={format.money(order.total, order.currencyCode)}
              date={format.orderDate(order.completedAt ?? order.createdAt)}
            />
          ))}
        </ul>
      )}
      {orders.hasNextPage && (
        <button
          type="button"
          onClick={() => orders.fetchNextPage()}
          disabled={orders.isFetchingNextPage}
          className={cn(
            storefront.iconButton,
            'h-10 w-full px-4 text-[14px] font-medium disabled:opacity-55 sm:w-fit sm:self-center'
          )}
        >
          {orders.isFetchingNextPage ? 'Loading…' : 'Show more orders'}
        </button>
      )}
    </AccountPage>
  )
}

CustomerAccountOrdersHome.layout = [StorefrontLayout, AccountLayout]
