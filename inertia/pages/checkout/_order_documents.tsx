import { FileText, Receipt } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import type { CheckoutOrder } from './_types'

const PAID_STATUSES = ['paid', 'partially_refunded', 'refunded']

type OrderDocumentsProps = {
  order: Pick<CheckoutOrder, 'paymentStatus'>
  /** e.g. `/account/orders/<id>`; the PDFs live at `<base>/invoice` and `<base>/receipt`. */
  baseUrl: string
}

/** Invoice and (once paid) receipt PDF downloads for the shopper. */
export default function OrderDocuments({ order, baseUrl }: OrderDocumentsProps) {
  const paid = order.paymentStatus !== null && PAID_STATUSES.includes(order.paymentStatus)
  return (
    <div
      className={cn(
        storefront.card,
        'flex flex-col gap-3 p-5 text-[14px] sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <div className="min-w-0">
        <h2 className="font-semibold">Documents</h2>
        <p className="text-sf-muted">Download a PDF copy for your records.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`${baseUrl}/invoice`} download className={storefront.secondaryButton}>
          <FileText size={16} /> Invoice
        </a>
        {paid && (
          <a href={`${baseUrl}/receipt`} download className={storefront.secondaryButton}>
            <Receipt size={16} /> Receipt
          </a>
        )}
      </div>
    </div>
  )
}
