import { Link } from '@adonisjs/inertia/react'
import { Badge, Skeleton } from '~/components/ui'
import { card } from '~/lib/styles'
import { useDateFormat } from '~/hooks/use_date_format'
import { useCan } from '../_hooks'
import { formatMoney, orderLabel, paymentStatusMeta } from '../orders/_format'
import { useAdminOrders } from '../orders/_hooks'

export default function OrdersCard({ customerId }: { customerId: string }) {
  const { formatOrderDate } = useDateFormat()
  const canViewOrders = useCan('orders.view')
  const { data, isLoading, isError } = useAdminOrders(
    { q: '', sort: 'number', direction: 'desc', page: 1, perPage: 15, customerId },
    canViewOrders
  )
  const orders = data?.data ?? []
  const total = data?.metadata.total ?? 0

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Orders</span>
          <h2 className={card.title}>Order history</h2>
        </div>
        {total > orders.length && (
          <span className="text-[12.5px] text-muted">
            Latest {orders.length} of {total}
          </span>
        )}
      </header>

      {!canViewOrders ? (
        <p className="py-6 text-center text-[13.5px] text-muted">
          You don&apos;t have access to orders.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <p className="py-6 text-center text-[13.5px] text-muted">Could not load orders.</p>
      ) : orders.length === 0 ? (
        <p className="py-6 text-center text-[13.5px] text-muted">No orders yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {orders.map((order) => {
            const payment = order.paymentStatus ? paymentStatusMeta[order.paymentStatus] : null
            return (
              <li key={order.id}>
                <Link
                  route="admin.orders.show"
                  routeParams={{ id: order.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 text-[13.5px] transition-colors duration-150 first:pt-0 last:pb-0 hover:text-ink"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{orderLabel(order)}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {formatOrderDate(order.completedAt ?? order.createdAt)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-ink">{formatMoney(order.total, order.currencyCode)}</span>
                    {payment && <Badge tone={payment.tone}>{payment.label}</Badge>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
