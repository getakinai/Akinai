import { Link } from '@adonisjs/inertia/react'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { card, cn, inlineLink, table } from '~/lib/styles'
import { toneSoft } from './_tones'
import type { OrderStatus, RecentOrder } from './_types'

const statusTone: Record<OrderStatus, string> = {
  paid: toneSoft.ok,
  pending: toneSoft.warning,
  shipped: toneSoft.accent,
  refunded: toneSoft.danger,
}

export default function RecentOrdersCard({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>Sales</div>
          <h2 className={card.title}>Recent orders</h2>
        </div>
        <Link route="admin.orders.home" className={card.action}>
          All orders <ArrowRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-right!">Total</th>
              <th className="max-[560px]:hidden">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="font-mono text-[12.5px]">
                  <Link
                    route="admin.orders.show"
                    routeParams={{ id: order.id }}
                    className={inlineLink}
                  >
                    {order.label}
                  </Link>
                </td>
                <td className="max-w-[180px] truncate">{order.customer}</td>
                <td>
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em]',
                      statusTone[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="text-right! font-medium tabular-nums">{order.total}</td>
                <td className="text-muted max-[560px]:hidden">{order.placedAt}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                      <ShoppingBag size={18} aria-hidden="true" />
                    </span>
                    <span className="text-[14px] font-medium text-ink">No orders yet</span>
                    <span className="text-[13px] text-muted">
                      New orders will appear here as soon as they come in.{' '}
                      <a href="/" className={inlineLink}>
                        Visit your store
                      </a>
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
