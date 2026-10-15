import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormInputNumber } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { orderLabel, variantLabel } from './_format'
import { useCreateFulfillment } from './_hooks'
import TrackingFields, { trackingDraft, trackingPayload } from './_tracking_fields'
import { type AdminOrderDetail } from './_types'

type FulfillDialogProps = {
  order: AdminOrderDetail
  open: boolean
  onClose: () => void
}

const remaining = (line: AdminOrderDetail['lineItems'][number]) =>
  Math.max(line.quantity - line.fulfilledQuantity - line.removedQuantity, 0)

export default function FulfillDialog({ order, open, onClose }: FulfillDialogProps) {
  const lines = order.lineItems.filter((line) => remaining(line) > 0)
  const [quantities, setQuantities] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lines.map((line) => [line.id, remaining(line)]))
  )
  const [tracking, setTracking] = useState(trackingDraft)
  const [notifyCustomer, setNotifyCustomer] = useState(Boolean(order.email))
  const [errors, setErrors] = useState<FieldErrors>({})
  const createFulfillment = useCreateFulfillment()

  const selected = lines
    .map((line) => ({ line, quantity: quantities[line.id] ?? 0 }))
    .filter(({ quantity }) => quantity > 0)

  const validate = () => {
    const next: FieldErrors = {}
    for (const line of lines) {
      const quantity = quantities[line.id]
      if (quantity === null || quantity === undefined) continue
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > remaining(line)) {
        next[`line:${line.id}`] = `Enter 0 to ${remaining(line)}`
      }
    }
    if (Object.keys(next).length === 0 && selected.length === 0) {
      next.lineItems = 'Choose at least one item to fulfill'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    createFulfillment.mutate(
      {
        orderId: order.id,
        lineItems: selected.map(({ line, quantity }) => ({ lineItemId: line.id, quantity })),
        ...trackingPayload(tracking),
        notifyCustomer,
      },
      {
        onSuccess: (saved) => {
          toast.success(`Items fulfilled for order ${orderLabel(saved)}`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = createFulfillment.isPending
  const serverErrors = Object.entries(errors)
    .filter(([key]) => key === 'order' || key.startsWith('lineItems'))
    .map(([, message]) => message)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Fulfill items for ${orderLabel(order)}`}
      description="Record the items you shipped. They are taken out of committed stock at the default location."
      className="w-[min(560px,calc(100vw-24px))]"
    >
      {serverErrors.map((message) => (
        <p key={message} className="text-[13.5px] text-danger">
          {message}
        </p>
      ))}

      <ul className="flex flex-col divide-y divide-line">
        {lines.map((line) => (
          <li
            key={line.id}
            className="grid grid-cols-[minmax(0,1fr)_112px] items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 pt-2">
              <p className="truncate text-[14px] font-medium text-ink">{variantLabel(line)}</p>
              <p className="text-[12.5px] text-muted">
                {remaining(line)} of {line.quantity} left to fulfill
              </p>
            </div>
            <FormInputNumber
              name={`quantity-${line.id}`}
              label={`Quantity of ${variantLabel(line)}`}
              hideLabel
              inputMode="numeric"
              min={0}
              max={remaining(line)}
              value={quantities[line.id] ?? null}
              disabled={disabled}
              error={errors[`line:${line.id}`]}
              onChange={(value) => {
                setQuantities((current) => ({ ...current, [line.id]: value }))
                setErrors({})
              }}
            />
          </li>
        ))}
      </ul>

      <TrackingFields value={tracking} onChange={setTracking} errors={errors} disabled={disabled} />

      {order.email && (
        <FormSwitch
          name="notifyCustomer"
          label="Send shipment details to the customer"
          checked={notifyCustomer}
          disabled={disabled}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
        />
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton type="button" loading={disabled} loadingText="Fulfilling…" onClick={save}>
          Fulfill {selected.reduce((sum, { quantity }) => sum + quantity, 0)} item(s)
        </FormButton>
      </div>
    </Dialog>
  )
}
