import { Link } from '@adonisjs/inertia/react'
import { CalendarDays, CreditCard, Landmark, Package } from 'lucide-react'
import { Badge } from '~/components/ui'
import { cn, storefront } from '~/lib/styles'
import { customerFulfillmentMeta } from '~/pages/checkout/_fulfillment'
import { customerPaymentMeta } from '~/pages/checkout/_refunds'
import type { CustomerOrder } from '../_types'

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  stripe: 'Card',
  poli: 'POLi',
}

type OrderCardProps = {
  order: CustomerOrder
  total: string
  date: string | null
}

/**
 * Ticket-style order row: details on the left, total and action split off
 * by a dashed divider (below on mobile, to the right from `sm`).
 */
export default function OrderCard({ order, total, date }: OrderCardProps) {
  const awaitingPayment = order.paymentStatus === 'pending' && !order.cancelled
  const payment = customerPaymentMeta(order.paymentStatus)
  const shipping = customerFulfillmentMeta(order.fulfillmentStatus)
  const PaymentIcon = order.paymentMethod === 'bank_transfer' ? Landmark : CreditCard
  const items = `${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'}`

  return (
    <li className={cn(storefront.card, 'flex flex-col overflow-hidden sm:flex-row')}>
      <div className="flex min-w-0 flex-1 gap-3 p-4">
        <span className="grid size-10 flex-none place-items-center rounded-lg bg-sf-primary-soft text-sf-primary">
          <Package size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className="text-[15px] font-semibold">Order #{order.orderNumber ?? '—'}</p>
            <span className="flex flex-wrap gap-1.5">
              {order.cancelled && <Badge tone="danger">Cancelled</Badge>}
              <Badge tone={payment.tone}>{payment.label}</Badge>
              {shipping && !order.cancelled && <Badge tone={shipping.tone}>{shipping.label}</Badge>}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[13.5px] text-sf-muted">
            {[items, order.shippingTitle].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-sf-muted">
            {date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="flex-none" /> {date}
              </span>
            )}
            {order.paymentMethod && (
              <span className="inline-flex items-center gap-1.5">
                <PaymentIcon size={13} className="flex-none" />
                {PAYMENT_LABELS[order.paymentMethod]}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-sf-line p-4 sm:w-[190px] sm:flex-none sm:flex-col sm:justify-center sm:border-t-0 sm:border-l">
        <span className="text-[15px] font-semibold tabular-nums">{total}</span>
        <Link
          route="customers.account.orders.show"
          routeParams={{ id: order.id }}
          className={cn(storefront.primaryButton, 'sm:w-full')}
        >
          {awaitingPayment ? 'View & pay' : 'View order'}
        </Link>
      </div>
    </li>
  )
}
