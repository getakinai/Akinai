import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInputNumber, FormSelect, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { returnReasonLabels } from '~/lib/returns'
import { useCreateAdminReturn } from '../returns/_hooks'
import {
  AdminReturnStorePayloadSchema,
  RETURN_REASONS,
  ReturnReasonSchema,
  type AdminOrderReturns,
  type ReturnReason,
} from '../returns/_types'
import { variantLabel } from './_format'

type CreateReturnDialogProps = {
  orderId: string
  lines: AdminOrderReturns['returnableLines']
  onClose: () => void
}

const reasonOptions = [
  { value: '', label: 'Choose a reason' },
  ...RETURN_REASONS.map((reason) => ({ value: reason, label: returnReasonLabels[reason] })),
]

/** Staff open a return for the customer (e.g. after a phone or email request). */
export default function CreateReturnDialog({ orderId, lines, onClose }: CreateReturnDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number | null>>({})
  const [reasons, setReasons] = useState<Record<string, ReturnReason | ''>>({})
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createReturn = useCreateAdminReturn()

  const submit = () => {
    const next: FieldErrors = {}
    const selected = lines
      .map((line) => ({ line, quantity: quantities[line.lineItemId] ?? 0 }))
      .filter(({ quantity }) => quantity > 0)
    for (const { line, quantity } of selected) {
      if (!Number.isInteger(quantity) || quantity > line.quantity) {
        next[`quantity:${line.lineItemId}`] = `Enter 1 to ${line.quantity}`
      }
      if (!reasons[line.lineItemId]) next[`reason:${line.lineItemId}`] = 'Choose a reason'
    }
    const parsed = AdminReturnStorePayloadSchema.safeParse({
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

    createReturn.mutate(
      { orderId, ...parsed.data },
      {
        onSuccess: (created) => {
          toast.success(`Return ${created.number} created`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = createReturn.isPending
  const generalErrors = Object.entries(errors)
    .filter(([key]) => key === 'lines' || key.startsWith('lines.'))
    .map(([, message]) => message)

  return (
    <Dialog
      open
      onClose={onClose}
      title="Create return"
      description="The return starts as requested. Approve it once you’ve told the customer how to send the items back."
      className="w-[min(560px,calc(100vw-24px))]"
    >
      {generalErrors.map((message) => (
        <p key={message} className="text-[13.5px] text-danger">
          {message}
        </p>
      ))}

      <ul className="flex flex-col divide-y divide-line">
        {lines.map((line) => {
          const quantity = quantities[line.lineItemId] ?? 0
          return (
            <li key={line.lineItemId} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="grid grid-cols-[minmax(0,1fr)_96px] items-start gap-3">
                <div className="min-w-0 pt-2">
                  <p className="truncate text-[14px] font-medium text-ink">{variantLabel(line)}</p>
                  <p className="text-[12.5px] text-muted">Up to {line.quantity} returnable</p>
                </div>
                <FormInputNumber
                  name={`staff-return-quantity-${line.lineItemId}`}
                  label={`Quantity of ${variantLabel(line)} to return`}
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
                  name={`staff-return-reason-${line.lineItemId}`}
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
        name="staff-return-note"
        label="Note (you can include it in the approval email)"
        rows={2}
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
        <FormButton type="button" loading={disabled} loadingText="Creating…" onClick={submit}>
          Create return
        </FormButton>
      </div>
    </Dialog>
  )
}
