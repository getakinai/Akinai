import { useState } from 'react'
import { Plus } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge } from '~/components/ui'
import { returnReasonLabels, returnStatusMeta } from '~/lib/returns'
import { card } from '~/lib/styles'
import { useAdminOrderReturns } from '../returns/_hooks'
import { type AdminReturn } from '../returns/_types'
import { useDateFormat } from '~/hooks/use_date_format'
import { variantLabel } from './_format'
import CreateReturnDialog from './_create_return_dialog'
import { type RefundPreset } from './_refund_dialog'
import ReturnActionDialog, { type ReturnAction } from './_return_action_dialog'
import { type AdminOrderDetail } from './_types'

type ReturnsCardProps = {
  order: AdminOrderDetail
  canEdit: boolean
  canRefund: boolean
  onRefund: (preset: RefundPreset) => void
}

type Open = { kind: 'create' } | { kind: 'action'; ret: AdminReturn; action: ReturnAction } | null

/** The order's returns with their next actions, and staff-created returns. */
export default function ReturnsCard({ order, canEdit, canRefund, onRefund }: ReturnsCardProps) {
  const { formatOrderDate } = useDateFormat()
  const { data } = useAdminOrderReturns(order.id)
  const [open, setOpen] = useState<Open>(null)
  const [dialogKey, setDialogKey] = useState(0)
  if (!data) return null

  const canCreate = canEdit && data.returnableLines.length > 0
  if (data.returns.length === 0 && !canCreate) return null
  const linesById = new Map(order.lineItems.map((line) => [line.id, line]))
  const show = (next: Open) => {
    setDialogKey((key) => key + 1)
    setOpen(next)
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Returns</span>
          <h2 className={card.title}>
            {data.returns.length === 0
              ? 'No returns'
              : `${data.returns.length} ${data.returns.length === 1 ? 'return' : 'returns'}`}
          </h2>
        </div>
        {canCreate && (
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => show({ kind: 'create' })}
          >
            <Plus size={14} /> Create return
          </FormButton>
        )}
      </header>

      {data.returns.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {data.returns.map((ret) => {
            const status = returnStatusMeta[ret.status]
            const action = (next: ReturnAction) => () => show({ kind: 'action', ret, action: next })
            const refundable = canRefund && (ret.status === 'approved' || ret.status === 'received')
            return (
              <li key={ret.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">Return {ret.number}</span>
                    <Badge tone={status.tone} dot>
                      {status.label}
                    </Badge>
                  </div>
                  <span className="text-[12.5px] text-muted">
                    Requested {formatOrderDate(ret.requestedAt)}
                  </span>
                </div>

                <ul className="flex flex-col gap-0.5 text-[13px] text-ink-2">
                  {ret.lines.map((line) => {
                    const orderLine = linesById.get(line.lineItemId)
                    return (
                      <li key={line.id}>
                        {line.quantity} × {orderLine ? variantLabel(orderLine) : 'Item'} ·{' '}
                        <span className="text-muted">{returnReasonLabels[line.reason]}</span>
                        {ret.receivedAt && (
                          <span className="text-muted">
                            {' '}
                            · {line.restock ? 'Restocked' : 'Not restocked'}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>

                {ret.customerNote && (
                  <p className="text-[13px] text-ink-2">
                    <span className="text-muted">Customer: </span>
                    {ret.customerNote}
                  </p>
                )}
                {ret.staffNote && (
                  <p className="text-[13px] text-ink-2">
                    <span className="text-muted">Note: </span>
                    {ret.staffNote}
                  </p>
                )}
                {ret.declineReason && (
                  <p className="text-[13px] text-ink-2">
                    <span className="text-muted">Declined: </span>
                    {ret.declineReason}
                  </p>
                )}

                {(canEdit || refundable) && (
                  <div className="flex flex-wrap gap-2">
                    {canEdit && ret.status === 'requested' && (
                      <>
                        <FormButton type="button" size="sm" onClick={action('approve')}>
                          Approve
                        </FormButton>
                        <FormButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={action('decline')}
                        >
                          Decline
                        </FormButton>
                      </>
                    )}
                    {canEdit && ret.status === 'approved' && (
                      <FormButton type="button" size="sm" onClick={action('receive')}>
                        Mark received
                      </FormButton>
                    )}
                    {refundable && (
                      <FormButton
                        type="button"
                        size="sm"
                        variant={ret.status === 'received' ? 'primary' : 'secondary'}
                        onClick={() =>
                          onRefund({
                            returnId: ret.id,
                            quantities: Object.fromEntries(
                              ret.lines.map((line) => [line.lineItemId, line.quantity])
                            ),
                          })
                        }
                      >
                        Refund
                      </FormButton>
                    )}
                    {canEdit && (ret.status === 'requested' || ret.status === 'approved') && (
                      <FormButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={action('cancel')}
                      >
                        Cancel return
                      </FormButton>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {open?.kind === 'create' && (
        <CreateReturnDialog
          key={dialogKey}
          orderId={order.id}
          lines={data.returnableLines}
          onClose={() => setOpen(null)}
        />
      )}
      {open?.kind === 'action' && (
        <ReturnActionDialog
          key={dialogKey}
          order={order}
          ret={open.ret}
          action={open.action}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}
