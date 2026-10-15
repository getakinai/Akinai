import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  FormAddressAutocomplete,
  FormButton,
  FormSwitch,
  FormInput,
  FormRegionField,
} from '~/components/form'
import { Dialog } from '~/components/ui'
import { regionValueFor } from '~/lib/country_regions'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { type PlaceAddress } from '~/lib/places'
import { useStoreSettings } from '~/pages/_hooks'
import { useCreateAdminCustomerAddress, useUpdateAdminCustomerAddress } from './_hooks'
import { AdminCustomerAddressFormSchema, type AdminCustomerAddress } from './_types'

type AddressDialogProps = {
  open: boolean
  customerId: string
  address: AdminCustomerAddress | null
  onClose: () => void
}

/**
 * Adds an address when `address` is null, otherwise edits it. Remount with a
 * new `key` to reset the fields between addresses.
 */
export default function AddressDialog({ open, customerId, address, onClose }: AddressDialogProps) {
  const [fullName, setFullName] = useState(address?.fullName ?? '')
  const [company, setCompany] = useState(address?.company ?? '')
  const [address1, setAddress1] = useState(address?.address1 ?? '')
  const [address2, setAddress2] = useState(address?.address2 ?? '')
  const [city, setCity] = useState(address?.city ?? '')
  const [region, setRegion] = useState(() =>
    regionValueFor(address?.countryCode ?? '', address?.province, address?.regionCode)
  )
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? '')
  const [countryCode, setCountryCode] = useState(address?.countryCode ?? '')
  const [phone, setPhone] = useState(address?.phone ?? '')
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const createAddress = useCreateAdminCustomerAddress()
  const updateAddress = useUpdateAdminCustomerAddress()
  const isPending = createAddress.isPending || updateAddress.isPending
  const { data: settings } = useStoreSettings()

  function changeCountry(code: string) {
    setCountryCode(code)
    setRegion((current) => regionValueFor(code, current.province, current.regionCode))
  }

  function applyPlaceAddress(selected: PlaceAddress) {
    const code = selected.countryCode || countryCode || settings?.storeCountryCode || ''
    setAddress1(selected.address1)
    setAddress2((current) => selected.address2 ?? selected.suburb ?? current)
    setCity(selected.city ?? '')
    setRegion(regionValueFor(code, selected.region))
    setPostalCode(selected.postalCode ?? '')
    setCountryCode(code)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminCustomerAddressFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      company: emptyToNull(company),
      address1,
      address2: emptyToNull(address2),
      city,
      province: emptyToNull(region.province),
      regionCode: region.regionCode || null,
      postalCode: emptyToNull(postalCode),
      countryCode,
      phone: emptyToNull(phone),
      isDefault,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: () => {
        toast.success(address ? 'Address updated' : 'Address added')
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (address) {
      updateAddress.mutate({ customerId, id: address.id, ...parsed.data }, options)
    } else {
      createAddress.mutate({ customerId, ...parsed.data }, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={address ? 'Edit address' : 'Add address'}
      description="Saved addresses can autofill at checkout."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            name="addressFullName"
            label="Recipient name"
            autoComplete="off"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
            autoFocus
          />
          <FormInput
            name="addressCompany"
            label="Company"
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            error={errors.company}
          />
        </div>
        <FormAddressAutocomplete
          name="addressLine1"
          label="Address"
          value={address1}
          countryCode={countryCode || settings?.storeCountryCode}
          onChange={setAddress1}
          onSelect={applyPlaceAddress}
          error={errors.address1}
        />
        <FormInput
          name="addressLine2"
          label="Apartment, suite, etc."
          autoComplete="off"
          value={address2}
          onChange={(event) => setAddress2(event.target.value)}
          error={errors.address2}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            name="addressCity"
            label="City"
            autoComplete="off"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            error={errors.city}
          />
          <FormRegionField
            name="addressProvince"
            freeTextLabel="Province / state"
            countryCode={countryCode}
            value={region}
            onChange={setRegion}
            error={errors.province ?? errors.regionCode}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            name="addressPostalCode"
            label="Postal code"
            autoComplete="off"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            error={errors.postalCode}
          />
          <FormInput
            name="addressCountryCode"
            label="Country code"
            placeholder="PH"
            autoComplete="off"
            maxLength={2}
            value={countryCode}
            onChange={(event) => changeCountry(event.target.value.toUpperCase())}
            error={errors.countryCode}
          />
        </div>
        <FormInput
          name="addressPhone"
          type="tel"
          label="Phone"
          autoComplete="off"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
        />
        <FormSwitch
          name="addressIsDefault"
          label="Default address"
          checked={isDefault}
          disabled={address?.isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          error={errors.isDefault}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {address ? 'Save address' : 'Add address'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
