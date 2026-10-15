import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge } from '~/components/ui'
import { returnReasonLabels, returnStatusHelp, returnStatusMeta } from '~/lib/returns'
import { cn, storefront } from '~/lib/styles'
import { type CheckoutOrder } from '~/pages/checkout/_types'
import { useCustomerOrderReturns } from '../../_hooks'
import ReturnRequestDialog from './_return_request_dialog'

type ReturnsSectionProps = {
  order: CheckoutOrder
  formatDate: (value: string) => string
}

/** The order's returns and, while eligible, the button to request one. */
export default function ReturnsSection({ order, formatDate }: ReturnsSectionProps) {
  const { data } = useCustomerOrderReturns(order.id)
  const [requesting, setRequesting] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  if (!data) return null

  const canRequest = data.returnableLines.length > 0
  if (!canRequest && data.returns.length === 0) return null
  const titles = new Map(order.lineItems.map((line) => [line.id, line.productTitle]))

  return (
    <section className={cn(storefront.card, 'flex flex-col gap-4 p-5 text-[14px]')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <RotateCcw size={16} aria-hidden="true" /> Returns
          </h2>
          {canRequest && data.returnWindowEndsAt && (
            <p className="text-[13px] text-sf-muted">
              You can request a return until {formatDate(data.returnWindowEndsAt)}.
            </p>
          )}
        </div>
        {canRequest && (
          <FormButton
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              setDialogKey((key) => key + 1)
              setRequesting(true)
            }}
          >
            Request a return
          </FormButton>
        )}
      </div>

      {data.returns.length > 0 && (
        <ul className="flex flex-col divide-y divide-sf-line">
          {data.returns.map((ret) => {
            const status = returnStatusMeta[ret.status]
            return (
              <li key={ret.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    Return {ret.number}
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </p>
                  <p className="text-[13px] text-sf-muted">
                    Requested {formatDate(ret.requestedAt)}
                  </p>
                </div>
                {ret.lines.map((line) => (
                  <p key={line.lineItemId} className="text-[13.5px] text-sf-muted">
                    {titles.get(line.lineItemId) ?? 'Item'} × {line.quantity} ·{' '}
                    {returnReasonLabels[line.reason]}
                  </p>
                ))}
                <p className="text-[13px]">{returnStatusHelp[ret.status]}</p>
                {ret.status === 'declined' && ret.declineReason && (
                  <p className="text-[13px] text-sf-muted">Reason: {ret.declineReason}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canRequest && requesting && (
        <ReturnRequestDialog
          key={dialogKey}
          orderId={order.id}
          lines={data.returnableLines}
          open
          onClose={() => setRequesting(false)}
        />
      )}
    </section>
  )
}
