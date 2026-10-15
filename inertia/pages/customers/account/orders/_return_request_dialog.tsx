import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInputNumber, FormSelect, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { returnReasonLabels } from '~/lib/returns'
import { useRequestCustomerReturn } from '../../_hooks'
import {
  CustomerReturnRequestSchema,
  RETURN_REASONS,
  ReturnReasonSchema,
  type CustomerOrderReturns,
  type ReturnReason,
} from '../../_types'

type ReturnRequestDialogProps = {
  orderId: string
  lines: CustomerOrderReturns['returnableLines']
  open: boolean
  onClose: () => void
}

const reasonOptions = [
  { value: '', label: 'Choose a reason' },
  ...RETURN_REASONS.map((reason) => ({ value: reason, label: returnReasonLabels[reason] })),
]

const lineLabel = (line: CustomerOrderReturns['returnableLines'][number]) =>
  line.variantTitle && line.variantTitle !== 'Default Title'
    ? `${line.productTitle} · ${line.variantTitle}`
    : line.productTitle

export default function ReturnRequestDialog({
  orderId,
  lines,
  open,
  onClose,
}: ReturnRequestDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number | null>>({})
  const [reasons, setReasons] = useState<Record<string, ReturnReason | ''>>({})
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const requestReturn = useRequestCustomerReturn(orderId)

  const submit = () => {
    const next: FieldErrors = {}
    const selected = lines
      .map((line, index) => ({ line, index, quantity: quantities[line.lineItemId] ?? 0 }))
      .filter(({ quantity }) => quantity > 0)
    for (const { line, quantity } of selected) {
      if (!Number.isInteger(quantity) || quantity > line.quantity) {
        next[`quantity:${line.lineItemId}`] = `Enter 1 to ${line.quantity}`
      }
      if (!reasons[line.lineItemId]) next[`reason:${line.lineItemId}`] = 'Choose a reason'
    }
    const parsed = CustomerReturnRequestSchema.safeParse({
      lines: selected.map(({ line, quantity }) => ({
        orderLineItemId: line.lineItemId,
        quantity,
        reason: reasons[line.lineItemId] || 'other',
        note: null,
      })),
      note: note.trim() || null,
    })
    if (!parsed.success) Object.assign(next, zodFieldErrors(parsed.error))
    setErrors(next)
    if (Object.keys(next).length > 0 || !parsed.success) return

    requestReturn.mutate(
      { orderId, ...parsed.data },
      {
        onSuccess: () => {
          toast.success('Return requested. We’ll email you with the next steps.')
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = requestReturn.isPending
  const generalErrors = Object.entries(errors)
    .filter(([key]) => key === 'lines' || key.startsWith('lines.'))
    .map(([, message]) => message)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request a return"
      description="Choose the items you’d like to send back. We’ll review your request and email you the next steps."
      className="w-[min(560px,calc(100vw-24px))]"
    >
      {generalErrors.map((message) => (
        <p key={message} className="text-[13.5px] text-danger">
          {message}
        </p>
      ))}

      <ul className="flex flex-col divide-y divide-sf-line">
        {lines.map((line) => {
          const quantity = quantities[line.lineItemId] ?? 0
          return (
            <li key={line.lineItemId} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="grid grid-cols-[minmax(0,1fr)_96px] items-start gap-3">
                <div className="min-w-0 pt-2">
                  <p className="truncate text-[14px] font-medium">{lineLabel(line)}</p>
                  <p className="text-[12.5px] text-sf-muted">
                    Up to {line.quantity} can be returned
                  </p>
                </div>
                <FormInputNumber
                  name={`return-quantity-${line.lineItemId}`}
                  label={`Quantity of ${lineLabel(line)} to return`}
                  hideLabel
                  inputMode="numeric"
                  min={0}
                  max={line.quantity}
                  value={quantities[line.lineItemId] ?? 0}
                  disabled={disabled}
                  error={errors[`quantity:${line.lineItemId}`]}
                  onChange={(value) => {
                    setQuantities((current) => ({ ...current, [line.lineItemId]: value }))
                    setErrors({})
                  }}
                />
              </div>
              {quantity > 0 && (
                <FormSelect
                  name={`return-reason-${line.lineItemId}`}
                  label="Reason"
                  options={reasonOptions}
                  value={reasons[line.lineItemId] ?? ''}
                  disabled={disabled}
                  error={errors[`reason:${line.lineItemId}`]}
                  onChange={(event) => {
                    const parsed = ReturnReasonSchema.safeParse(event.target.value)
                    setReasons((current) => ({
                      ...current,
                      [line.lineItemId]: parsed.success ? parsed.data : '',
                    }))
                    setErrors({})
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>

      <FormTextarea
        name="return-note"
        label="Anything else we should know? (optional)"
        rows={3}
        maxLength={1000}
        value={note}
        disabled={disabled}
        error={errors.note}
        onChange={(event) => setNote(event.target.value)}
      />

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton type="button" loading={disabled} loadingText="Sending…" onClick={submit}>
          Request return
        </FormButton>
      </div>
    </Dialog>
  )
}
