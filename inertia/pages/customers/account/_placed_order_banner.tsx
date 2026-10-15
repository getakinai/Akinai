import { Link } from '@adonisjs/inertia/react'
import { CircleCheck, X } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import BankDetails from '~/pages/checkout/_bank_details'
import { isOnlinePayment } from '~/pages/checkout/_types'
import { useCustomerOrder } from '../_hooks'

type PlacedOrderBannerProps = {
  orderId: string
  format: (amount: number, currencyCode: string) => string
  onDismiss: () => void
}

/**
 * Confirms the order the customer just placed. Keeps bank transfer
 * instructions on screen since signed-in checkouts skip the thank-you page.
 */
export default function PlacedOrderBanner({ orderId, format, onDismiss }: PlacedOrderBannerProps) {
  const { data: order } = useCustomerOrder(orderId)
  if (!order) return null

  const bankTransfer = order.bankTransfer
  const reference = order.bankReference
  const total = format(order.total, order.currencyCode)
  const pending = order.paymentStatus === 'pending'

  return (
    <section
      aria-live="polite"
      className={cn(storefront.card, 'flex gap-3 border-sf-primary/30 bg-sf-primary-soft p-4')}
    >
      <CircleCheck size={24} strokeWidth={1.75} className="flex-none text-sf-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-[14px]">
        <p className="font-semibold">Thank you! Order #{order.orderNumber} is confirmed.</p>

        {pending && order.paymentMethod === 'bank_transfer' && (
          <>
            <p>
              Your order is on hold until we receive your bank transfer of <strong>{total}</strong>.
              Use <strong>{reference}</strong> as the payment reference.
            </p>
            {bankTransfer && (
              <div className="rounded-lg bg-sf-surface p-3">
                <BankDetails bank={bankTransfer} reference={reference ?? undefined} />
              </div>
            )}
          </>
        )}

        {pending && isOnlinePayment(order.paymentMethod) && (
          <p>
            We haven’t received your {order.paymentMethod === 'poli' ? 'POLi' : 'card'} payment of{' '}
            <strong>{total}</strong> yet. If you’ve just paid, this can take a moment to update.
          </p>
        )}

        {!pending && <p>We’ll email {order.email} with updates on your order.</p>}

        <Link
          route="customers.account.orders.show"
          routeParams={{ id: order.id }}
          className="w-fit font-medium text-sf-primary underline-offset-2 hover:underline"
        >
          View order details
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-8 flex-none place-items-center rounded-lg text-sf-muted transition-colors hover:bg-sf-surface hover:text-sf-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <X size={16} />
      </button>
    </section>
  )
}
