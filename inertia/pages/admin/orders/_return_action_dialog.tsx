import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormSelect, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCan } from '../_hooks'
import { useAdminLocations } from '../locations/_hooks'
import {
  useApproveAdminReturn,
  useCancelAdminReturn,
  useDeclineAdminReturn,
  useReceiveAdminReturn,
} from '../returns/_hooks'
import { AdminReturnDeclinePayloadSchema, type AdminReturn } from '../returns/_types'
import { variantLabel } from './_format'
import { type AdminOrderDetail } from './_types'

export type ReturnAction = 'approve' | 'decline' | 'receive' | 'cancel'

type ReturnActionDialogProps = {
  order: AdminOrderDetail
  ret: AdminReturn
  action: ReturnAction
  onClose: () => void
}

const titles: Record<ReturnAction, string> = {
  approve: 'Approve return',
  decline: 'Decline return',
  receive: 'Mark items received',
  cancel: 'Cancel return',
}

const descriptions: Record<ReturnAction, string> = {
  approve: 'The customer is told to send the items back. Add return instructions in the note.',
  decline: 'The items stay with the customer and nothing is refunded.',
  receive: 'Record that the items arrived. Restocked items go back into inventory.',
  cancel: 'The return is closed without a refund. The items can be returned again later.',
}

/** Approve, decline, receive or cancel one return. */
export default function ReturnActionDialog({
  order,
  ret,
  action,
  onClose,
}: ReturnActionDialogProps) {
  const [note, setNote] = useState(ret.staffNote ?? '')
  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(Boolean(order.email))
  const [restock, setRestock] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ret.lines.map((line) => [line.id, true]))
  )
  const [locationId, setLocationId] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const approve = useApproveAdminReturn()
  const decline = useDeclineAdminReturn()
  const receive = useReceiveAdminReturn()
  const cancel = useCancelAdminReturn()
  const pending = approve.isPending || decline.isPending || receive.isPending || cancel.isPending

  const canViewLocations = useCan('locations.view')
  const locations = useAdminLocations(
    { q: '', status: 'active', sort: 'name', direction: 'asc', page: 1, perPage: 50 },
    { enabled: action === 'receive' && canViewLocations }
  )
  const linesById = new Map(order.lineItems.map((line) => [line.id, line]))

  const callbacks = (message: string) => ({
    onSuccess: () => {
      toast.success(message)
      onClose()
    },
    onError: (error: Error) => handleMutationError(error, setErrors),
  })

  const submit = () => {
    if (action === 'approve') {
      approve.mutate(
        { id: ret.id, staffNote: note.trim() || null, notifyCustomer },
        callbacks(`Return ${ret.number} approved`)
      )
    } else if (action === 'decline') {
      const parsed = AdminReturnDeclinePayloadSchema.safeParse({ reason, notifyCustomer })
      if (!parsed.success) {
        setErrors({ reason: parsed.error.issues[0]?.message ?? 'Enter a reason' })
        return
      }
      decline.mutate({ id: ret.id, ...parsed.data }, callbacks(`Return ${ret.number} declined`))
    } else if (action === 'receive') {
      receive.mutate(
        {
          id: ret.id,
          lines: ret.lines.map((line) => ({
            id: line.id,
            restock: restock[line.id] ?? false,
            locationId: restock[line.id] && locationId ? locationId : null,
          })),
        },
        callbacks(`Return ${ret.number} received`)
      )
    } else {
      cancel.mutate(ret.id, callbacks(`Return ${ret.number} cancelled`))
    }
  }

  const generalErrors = Object.entries(errors)
    .filter(([key]) => key === 'return' || key.startsWith('lines'))
    .map(([, message]) => message)
  const anyRestock = Object.values(restock).some(Boolean)

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${titles[action]} ${ret.number}`}
      description={descriptions[action]}
      className="w-[min(520px,calc(100vw-24px))]"
    >
      {generalErrors.map((message) => (
        <p key={message} className="text-[13.5px] text-danger">
          {message}
        </p>
      ))}

      {action === 'approve' && (
        <FormTextarea
          name="return-staff-note"
          label="Return instructions (shown in the email)"
          rows={3}
          maxLength={1000}
          value={note}
          disabled={pending}
          error={errors.staffNote}
          onChange={(event) => setNote(event.target.value)}
        />
      )}

      {action === 'decline' && (
        <FormTextarea
          name="return-decline-reason"
          label="Reason (shown to the customer)"
          rows={3}
          maxLength={500}
          value={reason}
          disabled={pending}
          error={errors.reason}
          onChange={(event) => {
            setReason(event.target.value)
            setErrors({})
          }}
        />
      )}

      {action === 'receive' && (
        <>
          <ul className="flex flex-col gap-2">
            {ret.lines.map((line) => {
              const orderLine = linesById.get(line.lineItemId)
              return (
                <li key={line.id}>
                  <FormSwitch
                    name={`return-restock-${line.id}`}
                    label={`Restock ${line.quantity} × ${orderLine ? variantLabel(orderLine) : 'item'}`}
                    checked={restock[line.id] ?? false}
                    disabled={pending}
                    onChange={(event) =>
                      setRestock((current) => ({ ...current, [line.id]: event.target.checked }))
                    }
                  />
                </li>
              )
            })}
          </ul>
          {anyRestock && canViewLocations && (
            <FormSelect
              name="return-location"
              label="Restock at"
              options={[
                { value: '', label: 'Default location' },
                ...(locations.data?.data ?? []).map((location) => ({
                  value: location.id,
                  label: location.name,
                })),
              ]}
              value={locationId}
              disabled={pending}
              onChange={(event) => setLocationId(event.target.value)}
            />
          )}
        </>
      )}

      {(action === 'approve' || action === 'decline') && order.email && (
        <FormSwitch
          name="return-notify"
          label="Email the customer"
          checked={notifyCustomer}
          disabled={pending}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
        />
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={pending} onClick={onClose}>
          Back
        </FormButton>
        <FormButton
          type="button"
          variant={action === 'decline' || action === 'cancel' ? 'danger' : 'primary'}
          loading={pending}
          loadingText="Saving…"
          onClick={submit}
        >
          {titles[action]}
        </FormButton>
      </div>
    </Dialog>
  )
}
