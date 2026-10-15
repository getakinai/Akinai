import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import Section from '~/components/section'
import AdminLayout from '~/layouts/admin'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { customerDisplayName } from './_format'
import { useCreateAdminCustomer } from './_hooks'
import LocationFields from './_location_fields'
import { AdminCustomerFormSchema } from './_types'

export default function AdminCustomersCreate() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [timezone, setTimezone] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createCustomer = useCreateAdminCustomer()

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
    createCustomer.mutate(parsed.data, {
      onSuccess: (customer) => {
        toast.success(`${customerDisplayName(customer)} added`)
        router.visit(`/admin/customers/edit/${customer.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Page
      eyebrow={
        <Link
          route="admin.customers.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Customers
        </Link>
      }
      title="Add customer"
      description="Create a customer profile. If they later sign up with this email, their account is linked to this profile."
    >
      <form className={panel} onSubmit={onSubmit} noValidate>
        <Section title="Contact">
          <FormInput
            name="fullName"
            label="Full name"
            autoComplete="off"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="email"
              type="email"
              label="Email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <FormInput
              name="phone"
              type="tel"
              label="Phone"
              autoComplete="off"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={errors.phone}
            />
          </div>
          <LocationFields
            countryCode={countryCode}
            timezone={timezone}
            onCountryChange={setCountryCode}
            onTimezoneChange={setTimezone}
            errors={errors}
          />
        </Section>

        <div className="mt-7 flex flex-wrap justify-end gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            onClick={() => router.visit('/admin/customers')}
          >
            Cancel
          </FormButton>
          <FormButton loading={createCustomer.isPending}>Create customer</FormButton>
        </div>
      </form>
    </Page>
  )
}

AdminCustomersCreate.layout = [AdminLayout]
