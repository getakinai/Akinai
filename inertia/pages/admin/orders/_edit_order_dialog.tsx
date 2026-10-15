import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormInput, FormInputNumber, FormSelect } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { formatMoney, orderLabel, paymentStatusMeta } from './_format'
import { useUpdateAdminOrder } from './_hooks'
import {
  type AdminOrderDetail,
  type AdminOrderUpdatePayload,
  type DraftLine,
  type ManualPaymentStatus,
} from './_types'
import ProductsCard from './drafts/_products_card'

type EditOrderDialogProps = {
  order: AdminOrderDetail
  open: boolean
  onClose: () => void
}

const paymentStatusOptions = (['pending', 'paid'] as const).map((status) => ({
  value: status,
  label: paymentStatusMeta[status].label,
}))

/** Existing lines use their line item id as the key so deleted variants stay editable. */
const lineKey = (line: AdminOrderDetail['lineItems'][number]) =>
  line.productVariantId ?? `line:${line.id}`

export default function EditOrderDialog({ order, open, onClose }: EditOrderDialogProps) {
  const lineItemIds = useMemo(
    () => new Map(order.lineItems.map((line) => [lineKey(line), line.id])),
    [order.lineItems]
  )
  const [paymentStatus, setPaymentStatus] = useState<ManualPaymentStatus>(
    order.paymentStatus === 'paid' ? 'paid' : 'pending'
  )
  const [lines, setLines] = useState<DraftLine[]>(() =>
    order.lineItems.map((line) => ({
      variantId: lineKey(line),
      productTitle: line.productTitle,
      variantTitle: line.variantTitle,
      sku: line.sku,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
    }))
  )
  const [overrideTotal, setOverrideTotal] = useState(order.isTotalOverridden)
  const [totalOverride, setTotalOverride] = useState<number | null>(
    order.isTotalOverridden ? order.total : null
  )
  const [reason, setReason] = useState(order.totalOverrideReason ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateOrder = useUpdateAdminOrder()

  const currencyCode = order.currencyCode
  const lineTotals = useMemo(
    () => new Map(lines.map((line) => [line.variantId, line.unitPrice * (line.quantity ?? 0)])),
    [lines]
  )

  const validate = () => {
    const next: FieldErrors = {}
    if (lines.length === 0) next.lineItems = 'Add at least one product'
    else if (
      !lines.every(
        (line) => line.quantity !== null && Number.isInteger(line.quantity) && line.quantity >= 1
      )
    ) {
      next.lineItems = 'Enter a whole-number quantity of at least 1 for every product'
    }
    if (overrideTotal) {
      if (totalOverride === null || totalOverride < 0)
        next.totalOverride = 'Enter the total to charge'
      if (!reason.trim()) next.totalOverrideReason = 'Add a reason for the override'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    const payload: AdminOrderUpdatePayload = {
      paymentStatus,
      lineItems: lines.map((line) => {
        const lineItemId = lineItemIds.get(line.variantId)
        return lineItemId
          ? { lineItemId, quantity: line.quantity ?? 0 }
          : { variantId: line.variantId, quantity: line.quantity ?? 0 }
      }),
      totalOverride: overrideTotal ? totalOverride : null,
      totalOverrideReason: overrideTotal ? reason.trim() : null,
    }
    updateOrder.mutate(
      { id: order.id, ...payload },
      {
        onSuccess: (saved) => {
          toast.success(`Order ${orderLabel(saved)} updated`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = updateOrder.isPending
  const hasFulfilled = order.lineItems.some((line) => line.fulfilledQuantity > 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit order ${orderLabel(order)}`}
      description="Products you add are priced at their current price and taken out of stock. Totals use this order’s saved discount, shipping and tax."
      className="w-[min(720px,calc(100vw-24px))]"
    >
      {errors.order && <p className="text-[13.5px] text-danger">{errors.order}</p>}

      <FormSelect
        name="paymentStatus"
        label="Payment status"
        options={paymentStatusOptions}
        value={paymentStatus}
        disabled={disabled}
        error={errors.paymentStatus}
        onChange={(event) => setPaymentStatus(event.target.value as ManualPaymentStatus)}
      />

      {hasFulfilled && (
        <p className="text-[13px] text-muted">
          Products can’t be changed once items are fulfilled. Cancel the fulfillments first to edit
          them.
        </p>
      )}
      <ProductsCard
        lines={lines}
        onChange={(next) => {
          setLines(next)
          setErrors({})
        }}
        currencyCode={currencyCode}
        lineTotals={lineTotals}
        errors={errors}
        disabled={disabled || hasFulfilled}
      />

      <div className="flex flex-col gap-3">
        <FormSwitch
          name="overrideTotal"
          label="Override total"
          checked={overrideTotal}
          disabled={disabled}
          onChange={(event) => {
            setOverrideTotal(event.target.checked)
            setErrors({})
          }}
        />
        {overrideTotal ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <FormInputNumber
              name="totalOverride"
              label={`Total (${currencyCode})`}
              inputMode="decimal"
              value={totalOverride}
              disabled={disabled}
              error={errors.totalOverride}
              onChange={setTotalOverride}
            />
            <FormInput
              name="totalOverrideReason"
              label="Reason"
              maxLength={255}
              value={reason}
              disabled={disabled}
              error={errors.totalOverrideReason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : (
          order.isTotalOverridden && (
            <p className="text-[12.5px] text-muted">
              Saving clears the override and charges the calculated total.
            </p>
          )
        )}
        {order.isTotalOverridden && order.calculatedTotal !== null && (
          <p className="text-[12.5px] text-muted">
            Calculated total before your changes: {formatMoney(order.calculatedTotal, currencyCode)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton type="button" loading={disabled} loadingText="Saving…" onClick={save}>
          Save order
        </FormButton>
      </div>
    </Dialog>
  )
}
