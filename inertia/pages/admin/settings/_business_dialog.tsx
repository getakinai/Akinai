import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  FormButton,
  FormCountrySelect,
  FormDateParts,
  FormInput,
  FormPhoneInput,
  FormSelect,
} from '~/components/form'
import Section from '~/components/section'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { BUSINESS_TYPE_OPTIONS, SOLE_TRADER } from '~/lib/store_settings'
import { useUpdateAdminStoreBusiness } from './_hooks'
import { AdminStoreBusinessFormSchema, type AdminStoreSettings } from './_types'

type BusinessDialogProps = {
  open: boolean
  settings: AdminStoreSettings
  onClose: () => void
}

/**
 * "About your business": the legal entity and the owner's details. Remount
 * with a new `key` to reset the fields.
 */
export default function BusinessDialog({ open, settings, onClose }: BusinessDialogProps) {
  const fallbackCountry = settings.businessCountryCode ?? settings.storeCountryCode ?? 'NZ'
  const [countryCode, setCountryCode] = useState(fallbackCountry)
  const [businessType, setBusinessType] = useState<string>(settings.businessType ?? '')
  const [legalName, setLegalName] = useState(settings.legalName ?? '')
  const [firstName, setFirstName] = useState(settings.ownerFirstName ?? '')
  const [lastName, setLastName] = useState(settings.ownerLastName ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(settings.ownerDateOfBirth ?? '')
  const [email, setEmail] = useState(settings.ownerEmail ?? '')
  const [phone, setPhone] = useState(settings.ownerPhone ?? '')
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    settings.ownerPhoneCountryCode ?? fallbackCountry
  )
  const [addressLine1, setAddressLine1] = useState(settings.ownerAddressLine1 ?? '')
  const [suburb, setSuburb] = useState(settings.ownerSuburb ?? '')
  const [city, setCity] = useState(settings.ownerCity ?? '')
  const [region, setRegion] = useState(settings.ownerRegion ?? '')
  const [postalCode, setPostalCode] = useState(settings.ownerPostalCode ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateBusiness = useUpdateAdminStoreBusiness()
  const isSoleTrader = businessType === SOLE_TRADER

  function onCountryChange(next: string) {
    if (!phone) setPhoneCountryCode(next)
    setCountryCode(next)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreBusinessFormSchema.safeParse({
      businessCountryCode: countryCode,
      businessType,
      legalName: isSoleTrader ? undefined : legalName,
      ownerFirstName: firstName,
      ownerLastName: lastName,
      ownerDateOfBirth: dateOfBirth,
      ownerEmail: email.trim(),
      ownerPhoneCountryCode: phoneCountryCode,
      ownerPhone: phone,
      ownerAddressLine1: addressLine1,
      ownerSuburb: emptyToNull(suburb),
      ownerCity: city,
      ownerRegion: emptyToNull(region),
      ownerPostalCode: postalCode,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateBusiness.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Business details saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="About your business"
      description="Used for financial products, markets, apps and taxes in this store."
      className="max-w-[640px]!"
    >
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Section title="Business">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink">
              What type of business do you have?
            </span>
            <div className="flex min-w-0 items-start gap-2">
              <FormCountrySelect
                name="businessCountryCode"
                label="Business country"
                hideLabel
                value={countryCode}
                onChange={onCountryChange}
                error={errors.businessCountryCode}
              />
              <div className="min-w-0 flex-1">
                <FormSelect
                  name="businessType"
                  label="Business type"
                  hideLabel
                  placeholder="Select a business type"
                  options={BUSINESS_TYPE_OPTIONS}
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  error={errors.businessType}
                />
              </div>
            </div>
          </div>

          {businessType && !isSoleTrader && (
            <FormInput
              name="legalName"
              label="Legal business name"
              autoComplete="organization"
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              error={errors.legalName}
            />
          )}
        </Section>

        <Section
          title="Owner details"
          description="The person legally responsible for the business. Kept private and never shown on the storefront."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="ownerFirstName"
              label="First name"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              error={errors.ownerFirstName}
            />
            <FormInput
              name="ownerLastName"
              label="Last name"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              error={errors.ownerLastName}
            />
          </div>

          <FormDateParts
            name="ownerDateOfBirth"
            label="Date of birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            error={errors.ownerDateOfBirth}
          />

          <FormInput
            name="ownerEmail"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.ownerEmail}
          />

          <FormPhoneInput
            name="ownerPhone"
            label="Phone number"
            value={phone}
            countryCode={phoneCountryCode}
            onChange={(nextPhone, nextCountry) => {
              setPhone(nextPhone)
              setPhoneCountryCode(nextCountry)
            }}
            error={errors.ownerPhone ?? errors.ownerPhoneCountryCode}
          />

          <FormInput
            name="ownerAddressLine1"
            label="Residential address"
            autoComplete="address-line1"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
            error={errors.ownerAddressLine1}
          />

          <FormInput
            name="ownerSuburb"
            label="Suburb"
            autoComplete="address-line2"
            value={suburb}
            onChange={(event) => setSuburb(event.target.value)}
            error={errors.ownerSuburb}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormInput
              name="ownerCity"
              label="City"
              autoComplete="address-level2"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              error={errors.ownerCity}
            />
            <FormInput
              name="ownerRegion"
              label="Region"
              autoComplete="address-level1"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              error={errors.ownerRegion}
            />
            <FormInput
              name="ownerPostalCode"
              label="Postal code"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              error={errors.ownerPostalCode}
            />
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-line pt-4">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={updateBusiness.isPending}>
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
