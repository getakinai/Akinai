import { Badge } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { type BadgeTone, card } from '~/lib/styles'
import { formatMoney, variantLabel } from './_format'
import { type AdminOrderDetail, type AdminRefund } from './_types'

const statusMeta: Record<AdminRefund['status'], { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  succeeded: { label: 'Refunded', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

const methodLabels: Record<AdminRefund['method'], string> = {
  stripe: 'Card (Stripe)',
  manual: 'Recorded manually',
}

/** The order's refunds, newest first, with their lines and status. */
export default function RefundsCard({ order }: { order: AdminOrderDetail }) {
  const { formatOrderDate } = useDateFormat()
  if (order.refunds.length === 0) return null
  const linesById = new Map(order.lineItems.map((line) => [line.id, line]))
  const money = (amount: number) => formatMoney(amount, order.currencyCode)

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Refunds</span>
          <h2 className={card.title}>{money(order.refundedTotal)} refunded</h2>
        </div>
      </header>
      <ul className="flex flex-col divide-y divide-line">
        {order.refunds.map((refund) => {
          const status = statusMeta[refund.status]
          return (
            <li key={refund.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">{money(refund.amount)}</span>
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                </div>
                <span className="text-[12.5px] text-muted">
                  {formatOrderDate(refund.createdAt)}
                </span>
              </div>
              <p className="text-[12.5px] text-muted">
                {[methodLabels[refund.method], refund.createdBy && `by ${refund.createdBy}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {refund.lines.length > 0 && (
                <ul className="flex flex-col gap-1 text-[13px] text-ink-2">
                  {refund.lines.map((refundLine) => {
                    const line = linesById.get(refundLine.lineItemId)
                    return (
                      <li key={refundLine.lineItemId} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {line ? variantLabel(line) : 'Removed item'} × {refundLine.quantity}
                          {refundLine.restock && ' · restocked'}
                        </span>
                        <span className="whitespace-nowrap">{money(refundLine.amount)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {refund.shippingAmount > 0 && (
                <p className="text-[13px] text-ink-2">Shipping {money(refund.shippingAmount)}</p>
              )}
              {refund.note && <p className="text-[13px] text-ink-2">{refund.note}</p>}
              {refund.failureReason && (
                <p className="text-[13px] text-danger">{refund.failureReason}</p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
