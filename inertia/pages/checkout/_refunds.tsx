import { Ban, Undo2 } from 'lucide-react'
import { cn, storefront, type BadgeTone } from '~/lib/styles'
import { type CheckoutOrder } from './_types'

const PAYMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Awaiting payment', tone: 'warning' },
  payment_submitted: { label: 'Payment submitted', tone: 'info' },
  partially_refunded: { label: 'Partially refunded', tone: 'info' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  voided: { label: 'Not charged', tone: 'neutral' },
}

/** Customer-facing payment status label and badge tone. */
export function customerPaymentMeta(status: CheckoutOrder['paymentStatus']) {
  return PAYMENT_STATUS[status ?? 'pending'] ?? PAYMENT_STATUS.pending
}

type OrderRefundsProps = {
  order: CheckoutOrder
  money: (amount: number) => string
  formatDate: (value: string) => string
  className?: string
}

/** Cancellation notice and the refunds issued on the order, with the net paid. */
export default function OrderRefunds({ order, money, formatDate, className }: OrderRefundsProps) {
  if (!order.cancelled && order.refunds.length === 0) return null
  const linesById = new Map(order.lineItems.map((line) => [line.id, line]))

  return (
    <section className={cn(storefront.card, 'flex flex-col gap-4 p-5 text-[14px]', className)}>
      {order.cancelled && (
        <p className="flex items-start gap-2">
          <Ban size={16} className="mt-0.5 flex-none text-sf-muted" aria-hidden="true" />
          <span>
            This order was cancelled
            {order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ''}.
            {order.paymentStatus === 'voided' && ' You have not been charged.'}
          </span>
        </p>
      )}
      {order.refunds.length > 0 && (
        <>
          <h2 className="flex items-center gap-2 font-semibold">
            <Undo2 size={16} aria-hidden="true" /> Refunds
          </h2>
          <ul className="flex flex-col divide-y divide-sf-line">
            {order.refunds.map((refund) => (
              <li key={refund.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="font-medium tabular-nums">{money(refund.amount)}</p>
                  <p className="text-[13px] text-sf-muted">{formatDate(refund.createdAt)}</p>
                </div>
                {refund.lines.map((refundLine) => {
                  const line = linesById.get(refundLine.lineItemId)
                  return (
                    <p key={refundLine.lineItemId} className="text-[13.5px] text-sf-muted">
                      {line?.productTitle ?? 'Item'} × {refundLine.quantity}
                    </p>
                  )
                })}
                {refund.shippingAmount > 0 && (
                  <p className="text-[13.5px] text-sf-muted">
                    Shipping {money(refund.shippingAmount)}
                  </p>
                )}
                <p className="text-[12.5px] text-sf-muted">
                  {refund.method === 'stripe'
                    ? 'Back to your card. It can take 5–10 business days to appear.'
                    : 'Sent back to you by the store.'}
                </p>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1 border-t border-sf-line pt-3">
            <div className="flex items-center justify-between gap-3">
              <dt>Refunded</dt>
              <dd className="tabular-nums">−{money(order.refundedTotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 font-semibold">
              <dt>Net paid</dt>
              <dd className="tabular-nums">{money(order.total - order.refundedTotal)}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
