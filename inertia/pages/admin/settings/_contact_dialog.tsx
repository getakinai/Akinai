import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormPhoneInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateAdminStoreContact } from './_hooks'
import { AdminStoreContactFormSchema, type AdminStoreSettings } from './_types'

type ContactDialogProps = {
  open: boolean
  settings: AdminStoreSettings
  onClose: () => void
}

export default function ContactDialog({ open, settings, onClose }: ContactDialogProps) {
  const [storeName, setStoreName] = useState(settings.storeName)
  const [contactEmail, setContactEmail] = useState(settings.contactEmail ?? '')
  const [phone, setPhone] = useState(settings.phone ?? '')
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    settings.phoneCountryCode ?? settings.storeCountryCode ?? settings.businessCountryCode ?? 'NZ'
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateContact = useUpdateAdminStoreContact()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreContactFormSchema.safeParse({
      storeName,
      contactEmail: contactEmail.trim(),
      phoneCountryCode: phone ? phoneCountryCode : null,
      phone: emptyToNull(phone),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateContact.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Store contact details saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Store contact details"
      description="Shown to customers on the storefront and in order emails."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="storeName"
          label="Store name"
          autoComplete="organization"
          value={storeName}
          onChange={(event) => setStoreName(event.target.value)}
          error={errors.storeName}
          autoFocus
        />
        <FormInput
          name="contactEmail"
          label="Store email"
          type="email"
          autoComplete="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          error={errors.contactEmail}
        />
        <FormPhoneInput
          name="phone"
          label="Store phone (optional)"
          value={phone}
          countryCode={phoneCountryCode}
          onChange={(nextPhone, nextCountry) => {
            setPhone(nextPhone)
            setPhoneCountryCode(nextCountry)
          }}
          error={errors.phone ?? errors.phoneCountryCode}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={updateContact.isPending}>
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
