import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { shippingExamplesFor } from '~/lib/shipping_examples'
import { useOperatingCountry } from '~/pages/_hooks'
import { useCreateAdminShippingZone } from './_hooks'
import { AdminShippingZoneFormSchema } from './_types'

type ZoneDialogProps = {
  open: boolean
  onClose: () => void
}

export default function ZoneDialog({ open, onClose }: ZoneDialogProps) {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createZone = useCreateAdminShippingZone()
  const examples = shippingExamplesFor(useOperatingCountry())

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminShippingZoneFormSchema.safeParse({ name, countryCodes: [] })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createZone.mutate(parsed.data, {
      onSuccess: (zone) => {
        toast.success(`${zone.name} created`)
        onClose()
        router.visit(`/admin/shipping/edit/${zone.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add shipping zone"
      description="Pick its destinations and rates on the next screen."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="zoneName"
          label="Name"
          tooltip="A zone groups destinations (whole countries or provinces) that share the same shipping rates."
          placeholder={examples.zoneName}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={createZone.isPending}>
            Create zone
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
