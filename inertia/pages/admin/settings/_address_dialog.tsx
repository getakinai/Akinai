import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  FormAddressAutocomplete,
  FormButton,
  FormInput,
  FormSelectWithSearch,
} from '~/components/form'
import { Dialog } from '~/components/ui'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { type PlaceAddress } from '~/lib/places'
import { useUpdateAdminStoreAddress } from './_hooks'
import { AdminStoreAddressFormSchema, type AdminStoreSettings } from './_types'

type AddressDialogProps = {
  open: boolean
  settings: AdminStoreSettings
  onClose: () => void
}

export default function AddressDialog({ open, settings, onClose }: AddressDialogProps) {
  const [addressLine1, setAddressLine1] = useState(settings.storeAddressLine1 ?? '')
  const [suburb, setSuburb] = useState(settings.storeSuburb ?? '')
  const [city, setCity] = useState(settings.storeCity ?? '')
  const [region, setRegion] = useState(settings.storeRegion ?? '')
  const [postalCode, setPostalCode] = useState(settings.storePostalCode ?? '')
  const [countryCode, setCountryCode] = useState(
    settings.storeCountryCode ?? settings.businessCountryCode ?? ''
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateAddress = useUpdateAdminStoreAddress()
  const hasBusinessAddress = Boolean(settings.ownerAddressLine1)

  function copyBusinessAddress() {
    setAddressLine1(settings.ownerAddressLine1 ?? '')
    setSuburb(settings.ownerSuburb ?? '')
    setCity(settings.ownerCity ?? '')
    setRegion(settings.ownerRegion ?? '')
    setPostalCode(settings.ownerPostalCode ?? '')
    setCountryCode(settings.businessCountryCode ?? countryCode)
  }

  function applyPlaceAddress(selected: PlaceAddress) {
    setAddressLine1(
      selected.address2 ? `${selected.address2}, ${selected.address1}` : selected.address1
    )
    setSuburb(selected.suburb ?? '')
    setCity(selected.city ?? '')
    setRegion(selected.region ?? '')
    setPostalCode(selected.postalCode ?? '')
    if (selected.countryCode) setCountryCode(selected.countryCode)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreAddressFormSchema.safeParse({
      storeAddressLine1: addressLine1,
      storeSuburb: emptyToNull(suburb),
      storeCity: city,
      storeRegion: emptyToNull(region),
      storePostalCode: postalCode,
      storeCountryCode: countryCode,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateAddress.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Store address saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Store address"
      description="Where customers can find or return items to your store."
      className="max-w-[600px]!"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {hasBusinessAddress && (
          <div>
            <FormButton type="button" variant="secondary" size="sm" onClick={copyBusinessAddress}>
              Copy business address
            </FormButton>
          </div>
        )}
        <FormSelectWithSearch
          name="storeCountryCode"
          label="Country"
          options={COUNTRY_OPTIONS}
          value={countryCode}
          onChange={setCountryCode}
          error={errors.storeCountryCode}
        />
        <FormAddressAutocomplete
          name="storeAddressLine1"
          label="Address"
          value={addressLine1}
          countryCode={countryCode}
          onChange={setAddressLine1}
          onSelect={applyPlaceAddress}
          error={errors.storeAddressLine1}
        />
        <FormInput
          name="storeSuburb"
          label="Suburb"
          autoComplete="address-line2"
          value={suburb}
          onChange={(event) => setSuburb(event.target.value)}
          error={errors.storeSuburb}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput
            name="storeCity"
            label="City"
            autoComplete="address-level2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            error={errors.storeCity}
          />
          <FormInput
            name="storeRegion"
            label="Region"
            autoComplete="address-level1"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            error={errors.storeRegion}
          />
          <FormInput
            name="storePostalCode"
            label="Postal code"
            autoComplete="postal-code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            error={errors.storePostalCode}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={updateAddress.isPending}>
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
