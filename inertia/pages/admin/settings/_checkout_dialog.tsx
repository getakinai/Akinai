import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import {
  DEFAULT_CHECKOUT_DELIVERY_HEADING,
  DEFAULT_CHECKOUT_DELIVERY_NOTE,
  MAX_CHECKOUT_DELIVERY_HEADING,
  MAX_CHECKOUT_DELIVERY_NOTE,
} from '~/lib/store_settings'
import { useUpdateAdminStoreCheckout } from './_hooks'
import { AdminStoreCheckoutFormSchema, type AdminStoreSettings } from './_types'

type CheckoutDialogProps = {
  open: boolean
  settings: AdminStoreSettings
  onClose: () => void
}

export default function CheckoutDialog({ open, settings, onClose }: CheckoutDialogProps) {
  const [heading, setHeading] = useState(settings.checkoutDeliveryHeading ?? '')
  const [note, setNote] = useState(settings.checkoutDeliveryNote ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateCheckout = useUpdateAdminStoreCheckout()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreCheckoutFormSchema.safeParse({
      checkoutDeliveryHeading: emptyToNull(heading),
      checkoutDeliveryNote: emptyToNull(note),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateCheckout.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Checkout delivery message saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Checkout delivery message"
      description="Shown above the delivery address at checkout. Leave a field empty to use the default."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="checkoutDeliveryHeading"
          label="Heading"
          placeholder={DEFAULT_CHECKOUT_DELIVERY_HEADING}
          maxLength={MAX_CHECKOUT_DELIVERY_HEADING}
          value={heading}
          onChange={(event) => setHeading(event.target.value)}
          error={errors.checkoutDeliveryHeading}
          autoFocus
        />
        <FormTextarea
          name="checkoutDeliveryNote"
          label="Note"
          rows={3}
          placeholder={DEFAULT_CHECKOUT_DELIVERY_NOTE}
          maxLength={MAX_CHECKOUT_DELIVERY_NOTE}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors.checkoutDeliveryNote}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={updateCheckout.isPending}>
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
