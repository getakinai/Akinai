import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateFulfillmentTracking } from './_hooks'
import TrackingFields, { trackingDraft, trackingPayload } from './_tracking_fields'
import { type AdminFulfillment } from './_types'

type TrackingDialogProps = {
  fulfillment: AdminFulfillment
  /** The order has a customer email to send the update to. */
  canNotify: boolean
  open: boolean
  onClose: () => void
}

export default function TrackingDialog({
  fulfillment,
  canNotify,
  open,
  onClose,
}: TrackingDialogProps) {
  const [tracking, setTracking] = useState(() => trackingDraft(fulfillment))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notifyCustomer, setNotifyCustomer] = useState(false)
  const updateTracking = useUpdateFulfillmentTracking()

  const save = () => {
    updateTracking.mutate(
      { id: fulfillment.id, ...trackingPayload(tracking), notifyCustomer },
      {
        onSuccess: () => {
          toast.success(`Tracking updated for fulfillment #${fulfillment.number}`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const disabled = updateTracking.isPending

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit tracking for fulfillment #${fulfillment.number}`}
      className="w-[min(520px,calc(100vw-24px))]"
    >
      {errors.fulfillment && <p className="text-[13.5px] text-danger">{errors.fulfillment}</p>}
      <TrackingFields value={tracking} onChange={setTracking} errors={errors} disabled={disabled} />
      {canNotify && (
        <FormSwitch
          name="notifyCustomer"
          label="Email the new tracking details to the customer"
          checked={notifyCustomer}
          disabled={disabled}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
        />
      )}
      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton type="button" loading={disabled} loadingText="Saving…" onClick={save}>
          Save tracking
        </FormButton>
      </div>
    </Dialog>
  )
}
