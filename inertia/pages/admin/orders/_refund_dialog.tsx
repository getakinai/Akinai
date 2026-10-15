import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  FormButton,
  FormSwitch,
  FormInputNumber,
  FormSelect,
  FormTextarea,
} from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { HttpError, type FieldErrors } from '~/lib/http'
import { useCan } from '../_hooks'
import { useAdminLocations } from '../locations/_hooks'
import { formatMoney, orderLabel, variantLabel } from './_format'
import { useCreateRefund, useRefundQuote } from './_hooks'
import { type AdminOrderDetail, type RefundLinesPayload } from './_types'
import SummaryRow from './_summary_row'

export type RefundPreset = {
  returnId: string
  /** Quantity per order line item id. */
  quantities: Record<string, number>
}

type RefundDialogProps = {
  order: AdminOrderDetail
  open: boolean
  onClose: () => void
  /** Refunding a received return: its lines are prefilled and not restocked again. */
  preset?: RefundPreset
}

type Line = AdminOrderDetail['lineItems'][number]

const refundable = (line: Line) => Math.max(line.quantity - line.refundedQuantity, 0)

export default function RefundDialog({ order, open, onClose, preset }: RefundDialogProps) {
  const lines = order.lineItems.filter((line) => refundable(line) > 0)
  const [quantities, setQuantities] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lines.map((line) => [line.id, preset?.quantities[line.id] ?? 0]))
  )
  const [shipping, setShipping] = useState<number | null>(0)
  const [amount, setAmount] = useState<number | null>(null)
  const [restock, setRestock] = useState(!preset)
  const [locationId, setLocationId] = useState('')
  const [note, setNote] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(Boolean(order.email))
  const [errors, setErrors] = useState<FieldErrors>({})
  const createRefund = useCreateRefund()

  const canViewLocations = useCan('locations.view')
  const locations = useAdminLocations(
    { q: '', status: 'active', sort: 'name', direction: 'asc', page: 1, perPage: 50 },
    { enabled: open && canViewLocations }
  )

  const lineErrors = useMemo(() => {
    const next: FieldErrors = {}
    for (const line of lines) {
      const quantity = quantities[line.id] ?? 0
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > refundable(line)) {
        next[`line:${line.id}`] = `Enter 0 to ${refundable(line)}`
      }
    }
    if (shipping !== null && shipping < 0) next.shipping = 'Enter 0 or more'
    return next
  }, [lines, quantities, shipping])

  const payload: RefundLinesPayload = {
    lines: lines
      .map((line) => ({ lineItemId: line.id, quantity: quantities[line.id] ?? 0 }))
      .filter(({ quantity }) => quantity > 0),
    shipping: shipping ?? 0,
  }
  const quote = useRefundQuote(order.id, payload, open && Object.keys(lineErrors).length === 0)
  const suggested = quote.data?.total ?? 0
  const finalAmount = amount ?? suggested
  const money = (value: number) => formatMoney(value, order.currencyCode)
  const isCard = order.paymentMethod === 'stripe'
  const quoteError =
    quote.error instanceof HttpError
      ? (Object.values(quote.error.fieldErrors)[0] ?? quote.error.message)
      : quote.error
        ? 'Could not calculate the refund'
        : null

  const save = () => {
    const next: FieldErrors = { ...lineErrors }
    if (finalAmount <= 0) next.amount = 'Enter an amount to refund'
    if (quote.data && finalAmount > quote.data.maximum) {
      next.amount = `Enter at most ${money(quote.data.maximum)}`
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    createRefund.mutate(
      {
        orderId: order.id,
        ...payload,
        amount: finalAmount,
        restock,
        locationId: restock && locationId ? locationId : null,
        note: note.trim() || null,
        notifyCustomer,
        returnId: preset?.returnId ?? null,
      },
      {
        onSuccess: (saved) => {
          toast.success(`Refunded ${money(finalAmount)} on order ${orderLabel(saved)}`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = createRefund.isPending
  const serverErrors = Object.entries(errors)
    .filter(([key]) => key === 'order' || key.startsWith('lines'))
    .map(([, message]) => message)
  const locationOptions = [
    { value: '', label: 'Default location' },
    ...(locations.data?.data ?? []).map((location) => ({
      value: location.id,
      label: location.name,
    })),
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Refund order ${orderLabel(order)}`}
      description={
        isCard
          ? 'The refund goes back to the customer’s card through Stripe.'
          : 'This records the refund. Send the money to the customer yourself, for example by bank transfer.'
      }
      className="w-[min(600px,calc(100vw-24px))]"
    >
      {serverErrors.map((message) => (
        <p key={message} className="text-[13.5px] text-danger">
          {message}
        </p>
      ))}

      {lines.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {lines.map((line) => (
            <li
              key={line.id}
              className="grid grid-cols-[minmax(0,1fr)_104px] items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 pt-2">
                <p className="truncate text-[14px] font-medium text-ink">{variantLabel(line)}</p>
                <p className="text-[12.5px] text-muted">
                  {money(line.unitPrice)} · {refundable(line)} of {line.quantity} refundable
                </p>
              </div>
              <FormInputNumber
                name={`refund-quantity-${line.id}`}
                label={`Quantity of ${variantLabel(line)} to refund`}
                hideLabel
                inputMode="numeric"
                min={0}
                max={refundable(line)}
                value={quantities[line.id] ?? null}
                disabled={disabled}
                error={errors[`line:${line.id}`]}
                onChange={(value) => {
                  setQuantities((current) => ({ ...current, [line.id]: value }))
                  setAmount(null)
                  setErrors({})
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInputNumber
          name="refund-shipping"
          label={
            quote.data
              ? `Shipping (up to ${money(quote.data.shippingRefundable)})`
              : 'Shipping to refund'
          }
          inputMode="decimal"
          min={0}
          step="0.01"
          value={shipping}
          disabled={disabled}
          error={errors.shipping}
          onChange={(value) => {
            setShipping(value)
            setAmount(null)
            setErrors({})
          }}
        />
        <FormInputNumber
          name="refund-amount"
          label="Refund amount"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount ?? suggested}
          disabled={disabled}
          error={errors.amount}
          onChange={(value) => {
            setAmount(value)
            setErrors({})
          }}
        />
      </div>

      {quoteError && <p className="text-[13.5px] text-danger">{quoteError}</p>}
      <div className="divide-y divide-line rounded-lg border border-line px-3">
        <SummaryRow label="Items and shipping" amount={money(quote.data?.subtotal ?? 0)} />
        {(quote.data?.tax ?? 0) > 0 && <SummaryRow label="Tax" amount={money(quote.data!.tax)} />}
        <SummaryRow strong label="Suggested refund" amount={money(suggested)} />
        <SummaryRow
          label="Available to refund"
          amount={money(quote.data?.maximum ?? order.total - order.refundedTotal)}
        />
      </div>

      <FormSwitch
        name="refund-restock"
        label="Restock the refunded items"
        checked={restock}
        disabled={disabled}
        onChange={(event) => setRestock(event.target.checked)}
      />
      {restock && canViewLocations && (
        <FormSelect
          name="refund-location"
          label="Restock shipped items at"
          options={locationOptions}
          value={locationId}
          disabled={disabled}
          error={errors.locationId}
          onChange={(event) => setLocationId(event.target.value)}
        />
      )}

      <FormTextarea
        name="refund-note"
        label="Reason (staff only)"
        rows={2}
        maxLength={500}
        value={note}
        disabled={disabled}
        error={errors.note}
        onChange={(event) => setNote(event.target.value)}
      />

      {order.email && (
        <FormSwitch
          name="refund-notify"
          label="Email the customer about the refund"
          checked={notifyCustomer}
          disabled={disabled}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
        />
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          loading={disabled}
          loadingText="Refunding…"
          disabled={quote.isFetching && amount === null}
          onClick={save}
        >
          Refund {money(finalAmount)}
        </FormButton>
      </div>
    </Dialog>
  )
}
