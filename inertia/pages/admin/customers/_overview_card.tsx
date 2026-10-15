import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import Section from '~/components/section'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { customerDisplayName } from './_format'
import { useUpdateAdminCustomer } from './_hooks'
import LocationFields from './_location_fields'
import { AdminCustomerFormSchema, type AdminCustomerDetail } from './_types'

type OverviewCardProps = {
  customer: AdminCustomerDetail
  editable: boolean
}

/**
 * Remount with a new `key` after the customer changes to reset the fields.
 */
export default function OverviewCard({ customer, editable }: OverviewCardProps) {
  const [fullName, setFullName] = useState(customer.fullName ?? '')
  const [email, setEmail] = useState(customer.email)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [countryCode, setCountryCode] = useState(customer.countryCode ?? '')
  const [timezone, setTimezone] = useState(customer.timezone ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateCustomer = useUpdateAdminCustomer()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminCustomerFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      email,
      phone: emptyToNull(phone),
      countryCode: emptyToNull(countryCode),
      timezone: emptyToNull(timezone),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateCustomer.mutate(
      { id: customer.id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${customerDisplayName(saved)} saved`),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className={panel} onSubmit={onSubmit} noValidate>
      <Section
        title="Contact"
        description={
          customer.account
            ? 'Changing the email also changes the email they sign in with. Changing the country moves them to the market that covers it.'
            : 'Changing the country moves them to the market that covers it.'
        }
      >
        <FormInput
          name="fullName"
          label="Full name"
          autoComplete="off"
          value={fullName}
          disabled={!editable}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <FormInput
          name="email"
          type="email"
          label="Email"
          autoComplete="off"
          value={email}
          disabled={!editable}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <FormInput
          name="phone"
          type="tel"
          label="Phone"
          autoComplete="off"
          value={phone}
          disabled={!editable}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
        />
        <LocationFields
          countryCode={countryCode}
          timezone={timezone}
          onCountryChange={setCountryCode}
          onTimezoneChange={setTimezone}
          errors={errors}
          disabled={!editable}
          savedCountry={
            customer.countryCode
              ? { code: customer.countryCode, name: customer.countryName ?? customer.countryCode }
              : null
          }
        />
        {editable && (
          <div className="flex justify-end">
            <FormButton size="sm" loading={updateCustomer.isPending}>
              Save contact
            </FormButton>
          </div>
        )}
      </Section>
    </form>
  )
}
