import { type FormEvent, useState } from 'react'
import { Head } from '@inertiajs/react'
import { FormButton } from '~/components/form'
import CustomerAuthLayout from '~/layouts/customer_auth'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { auth, cn } from '~/lib/styles'
import { countryTimezones, pickTimezone } from '~/lib/timezones'
import { useStoreMarket } from '~/pages/_hooks'
import { useCustomerLocationOptions, useCustomerLogout, useUpdateCustomerLocation } from '../_hooks'
import { CustomerLocationFormSchema, type CustomerLocationReturnTo } from '../_types'
import LocationFields from './_location_fields'

/**
 * Shown after sign-in (password, signup or Google/Microsoft) until the
 * customer picks their country. The country is pre-filled from the market
 * they are shopping in; the timezone from that country's list (the
 * browser's when it matches, or the country's only one).
 */
export default function CustomerAccountWelcome({
  returnTo,
}: {
  returnTo: CustomerLocationReturnTo
}) {
  const options = useCustomerLocationOptions()
  const market = useStoreMarket()
  const updateLocation = useUpdateCustomerLocation()
  const logout = useCustomerLogout()
  const [chosenCountry, setChosenCountry] = useState<string | null>(null)
  const [chosenTimezone, setChosenTimezone] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const countries = options.data?.countries ?? []
  const marketCountry = market.data?.current.countryCode ?? ''
  const defaultCountry = countries.some(({ code }) => code === marketCountry) ? marketCountry : ''
  const countryCode = chosenCountry ?? defaultCountry
  const timezone = chosenTimezone ?? pickTimezone(countryTimezones(options.data, countryCode), '')
  const noCountries = options.isSuccess && countries.length === 0

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = CustomerLocationFormSchema.safeParse({ countryCode, timezone, returnTo })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateLocation.mutate(parsed.data, {
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <>
      <Head title="Complete your profile" />
      <h1 className={cn(auth.title, 'text-center')}>One last step</h1>
      <p className={cn(auth.subtitle, 'text-center')}>
        Tell us where you’re from so we can show the right prices and delivery options.
      </p>

      {options.isError && (
        <p className="text-center text-[14px] text-danger">
          We couldn’t load the list of countries.{' '}
          <button type="button" className="font-medium underline" onClick={() => options.refetch()}>
            Try again
          </button>
        </p>
      )}

      {noCountries ? (
        <p className="text-center text-[14px] text-muted">
          We aren’t selling to any countries right now. Please check back soon.
        </p>
      ) : (
        <form className={auth.form} onSubmit={onSubmit} noValidate>
          <LocationFields
            options={options.data}
            isLoading={options.isLoading}
            countryCode={countryCode}
            timezone={timezone}
            onCountryChange={setChosenCountry}
            onTimezoneChange={setChosenTimezone}
            errors={errors}
          />
          <FormButton block loading={updateLocation.isPending} disabled={!options.data}>
            Continue
          </FormButton>
        </form>
      )}

      <FormButton
        type="button"
        variant="ghost"
        size="sm"
        className="mx-auto mt-3 flex"
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Sign out
      </FormButton>
    </>
  )
}

CustomerAccountWelcome.layout = [CustomerAuthLayout]
