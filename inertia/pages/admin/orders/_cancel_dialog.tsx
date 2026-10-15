import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormSelect, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { cancelReasonLabels, formatMoney, orderLabel } from './_format'
import { useCancelOrder } from './_hooks'
import {
  CANCEL_REASONS,
  CancelReasonSchema,
  type AdminOrderDetail,
  type CancelReason,
} from './_types'

type CancelDialogProps = {
  order: AdminOrderDetail
  open: boolean
  onClose: () => void
}

const reasonOptions = CANCEL_REASONS.map((reason) => ({
  value: reason,
  label: cancelReasonLabels[reason],
}))

const PAID = new Set(['paid', 'partially_refunded'])

export default function CancelDialog({ order, open, onClose }: CancelDialogProps) {
  const isPaid = order.paymentStatus !== null && PAID.has(order.paymentStatus)
  const refundable = Math.max(order.total - order.refundedTotal, 0)
  const hasActiveFulfillment = order.fulfillments.some(
    (fulfillment) => fulfillment.status === 'success'
  )
  const [reason, setReason] = useState<CancelReason>('customer')
  const [restock, setRestock] = useState(true)
  const [refund, setRefund] = useState(isPaid && refundable > 0)
  const [notifyCustomer, setNotifyCustomer] = useState(Boolean(order.email))
  const [staffNote, setStaffNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const cancelOrder = useCancelOrder()

  const save = () => {
    cancelOrder.mutate(
      {
        orderId: order.id,
        reason,
        restock,
        refund: isPaid && refund,
        notifyCustomer,
        staffNote: staffNote.trim() || null,
      },
      {
        onSuccess: (saved) => {
          toast.success(`Order ${orderLabel(saved)} cancelled`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = cancelOrder.isPending

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cancel order ${orderLabel(order)}?`}
      description="A cancelled order can’t be fulfilled or edited, and this can’t be undone."
      className="w-[min(520px,calc(100vw-24px))]"
    >
      {hasActiveFulfillment && (
        <p className="text-[13.5px] text-danger">
          Cancel this order’s fulfillments before cancelling the order.
        </p>
      )}
      {errors.order && <p className="text-[13.5px] text-danger">{errors.order}</p>}

      <FormSelect
        name="cancel-reason"
        label="Reason"
        options={reasonOptions}
        value={reason}
        disabled={disabled}
        error={errors.reason}
        onChange={(event) => setReason(CancelReasonSchema.parse(event.target.value))}
      />
      <FormSwitch
        name="cancel-restock"
        label="Put the items back in stock"
        checked={restock}
        disabled={disabled}
        onChange={(event) => setRestock(event.target.checked)}
      />
      {isPaid && refundable > 0 && (
        <FormSwitch
          name="cancel-refund"
          label={`Refund ${formatMoney(refundable, order.currencyCode)} ${
            order.paymentMethod === 'stripe' ? 'to the customer’s card' : '(send it yourself)'
          }`}
          checked={refund}
          disabled={disabled}
          onChange={(event) => setRefund(event.target.checked)}
        />
      )}
      {order.email && (
        <FormSwitch
          name="cancel-notify"
          label="Email the customer that the order was cancelled"
          checked={notifyCustomer}
          disabled={disabled}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
        />
      )}
      <FormTextarea
        name="cancel-note"
        label="Note (staff only)"
        rows={2}
        maxLength={500}
        value={staffNote}
        disabled={disabled}
        error={errors.staffNote}
        onChange={(event) => setStaffNote(event.target.value)}
      />

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Keep order
        </FormButton>
        <FormButton
          type="button"
          variant="danger"
          loading={disabled}
          loadingText="Cancelling…"
          disabled={hasActiveFulfillment}
          onClick={save}
        >
          Cancel order
        </FormButton>
      </div>
    </Dialog>
  )
}
