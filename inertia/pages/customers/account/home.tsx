import { type ReactNode, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ShoppingBag } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import { useCustomerAddresses, useCustomerMe, useRecentCustomerOrders } from '../_hooks'
import AccountPage, { EmptyState, ErrorState } from './_account_page'
import { useAccountFormat } from './_format'
import OrderCard from './_order_card'
import PlacedOrderBanner from './_placed_order_banner'

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={cn(storefront.card, 'flex items-center justify-between gap-3 p-4 sm:block')}>
      <p className="text-[13px] text-sf-muted">{label}</p>
      <div className="text-[20px] font-semibold tabular-nums sm:mt-1">{value}</div>
    </div>
  )
}

export default function CustomerAccountHome({ placedOrderId }: { placedOrderId: string | null }) {
  const [bannerOpen, setBannerOpen] = useState(placedOrderId !== null)
  const customer = useCustomerMe()
  const orders = useRecentCustomerOrders()
  const addresses = useCustomerAddresses()
  const format = useAccountFormat()

  const firstName = customer.data?.fullName?.split(' ')[0]
  const recent = orders.data?.data ?? []

  return (
    <AccountPage
      title="My account"
      heading={
        customer.isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : firstName ? (
          `Hi, ${firstName}`
        ) : (
          'My account'
        )
      }
      description="Track your orders and manage your details."
    >
      {placedOrderId && bannerOpen && (
        <PlacedOrderBanner
          orderId={placedOrderId}
          format={format.money}
          onDismiss={() => setBannerOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Orders"
          value={orders.data?.metadata.total ?? <Skeleton className="h-6 w-10" />}
        />
        <Stat
          label="Saved addresses"
          value={addresses.data?.length ?? <Skeleton className="h-6 w-10" />}
        />
        <Stat
          label="Member since"
          value={
            customer.data ? format.date(customer.data.createdAt) : <Skeleton className="h-6 w-24" />
          }
        />
      </div>

      <section aria-labelledby="recent-orders" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-orders" className="text-[17px] font-semibold tracking-[-0.01em]">
            Recent orders
          </h2>
          {recent.length > 0 && (
            <Link
              route="customers.account.orders.home"
              className="text-[13.5px] font-medium text-sf-primary hover:underline"
            >
              View all orders
            </Link>
          )}
        </div>
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
        {orders.data && recent.length === 0 && (
          <EmptyState icon={<ShoppingBag size={20} />} title="No orders yet">
            <p>When you place an order, it will show up here.</p>
            <Link route="home" className={cn(storefront.primaryButton, 'mt-3')}>
              Start shopping
            </Link>
          </EmptyState>
        )}
        {recent.length > 0 && (
          <ul className="flex flex-col gap-3">
            {recent.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                total={format.money(order.total, order.currencyCode)}
                date={format.date(order.completedAt ?? order.createdAt)}
              />
            ))}
          </ul>
        )}
      </section>
    </AccountPage>
  )
}

CustomerAccountHome.layout = [StorefrontLayout, AccountLayout]
