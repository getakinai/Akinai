import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { cn, storefront } from '~/lib/styles'
import { useCustomerLocationOptions, useUpdateCustomerDetails } from '../../_hooks'
import { CustomerDetailsFormSchema, type Customer } from '../../_types'
import LocationFields from '../_location_fields'

/**
 * Edits the signed-in customer's name, email, phone, country and timezone.
 * Remount with a new `key` after the customer changes to reset the fields.
 * Asks for the current password only when the email (the login) changes.
 */
export default function DetailsForm({ customer }: { customer: Customer }) {
  const [fullName, setFullName] = useState(customer.fullName ?? '')
  const [email, setEmail] = useState(customer.email)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [countryCode, setCountryCode] = useState(customer.countryCode ?? '')
  const [timezone, setTimezone] = useState(customer.timezone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const locationOptions = useCustomerLocationOptions()
  const updateDetails = useUpdateCustomerDetails()

  const emailChanged = email.trim().toLowerCase() !== customer.email.toLowerCase()
  const dirty =
    emailChanged ||
    fullName !== (customer.fullName ?? '') ||
    phone !== (customer.phone ?? '') ||
    countryCode !== (customer.countryCode ?? '') ||
    timezone !== (customer.timezone ?? '')

  function reset() {
    setFullName(customer.fullName ?? '')
    setEmail(customer.email)
    setPhone(customer.phone ?? '')
    setCountryCode(customer.countryCode ?? '')
    setTimezone(customer.timezone ?? '')
    setCurrentPassword('')
    setErrors({})
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = CustomerDetailsFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      email,
      phone: emptyToNull(phone),
      countryCode,
      timezone,
      currentPassword: emailChanged ? currentPassword : undefined,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateDetails.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Your details were updated')
        setCurrentPassword('')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className={cn(storefront.card, 'flex flex-col gap-4 p-5')} onSubmit={onSubmit} noValidate>
      <FormInput
        name="fullName"
        label="Full name"
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        error={errors.fullName}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <FormInput
          name="phone"
          type="tel"
          label="Phone (optional)"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LocationFields
          options={locationOptions.data}
          isLoading={locationOptions.isLoading}
          countryCode={countryCode}
          timezone={timezone}
          onCountryChange={setCountryCode}
          onTimezoneChange={setTimezone}
          errors={errors}
          savedCountry={
            customer.countryCode
              ? { code: customer.countryCode, name: customer.countryName ?? customer.countryCode }
              : null
          }
        />
      </div>
      {locationOptions.isError && (
        <p className="text-[13px] text-danger">
          We couldn’t load the list of countries.{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => locationOptions.refetch()}
          >
            Try again
          </button>
        </p>
      )}
      {emailChanged && (
        <div className="flex flex-col gap-2 rounded-lg bg-sf-primary-soft p-3">
          <p className="text-[13px] text-sf-text">
            You sign in with your email, so enter your password to change it.
          </p>
          <FormInput
            name="currentPassword"
            type="password"
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={errors.currentPassword}
          />
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={!dirty || updateDetails.isPending}
          onClick={reset}
        >
          Cancel
        </FormButton>
        <FormButton size="sm" disabled={!dirty} loading={updateDetails.isPending}>
          Save changes
        </FormButton>
      </div>
    </form>
  )
}
