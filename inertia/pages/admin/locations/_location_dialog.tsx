import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminLocation, useUpdateAdminLocation } from './_hooks'
import { AdminLocationFormSchema, type AdminLocation } from './_types'

type LocationDialogProps = {
  open: boolean
  location: AdminLocation | null
  onClose: () => void
}

/**
 * Creates a location when `location` is null, otherwise edits it. Remount
 * with a new `key` to reset the fields between locations.
 */
export default function LocationDialog({ open, location, onClose }: LocationDialogProps) {
  const [name, setName] = useState(location?.name ?? '')
  const [addressLine, setAddressLine] = useState(location?.addressLine ?? '')
  const [city, setCity] = useState(location?.city ?? '')
  const [country, setCountry] = useState(location?.country ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createLocation = useCreateAdminLocation()
  const updateLocation = useUpdateAdminLocation()
  const isPending = createLocation.isPending || updateLocation.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminLocationFormSchema.safeParse({
      name,
      addressLine: emptyToNull(addressLine),
      city: emptyToNull(city),
      country: emptyToNull(country),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminLocation) => {
        toast.success(location ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (location) {
      updateLocation.mutate({ id: location.id, ...parsed.data }, options)
    } else {
      createLocation.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={location ? 'Edit location' : 'Add location'}
      description="A warehouse, store or fulfillment site where stock is held."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="locationName"
          label="Name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <FormInput
          name="locationAddressLine"
          label="Address"
          autoComplete="off"
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          error={errors.addressLine}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            name="locationCity"
            label="City"
            autoComplete="off"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            error={errors.city}
          />
          <FormInput
            name="locationCountry"
            label="Country"
            autoComplete="off"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            error={errors.country}
          />
        </div>
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {location ? 'Save changes' : 'Create location'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
