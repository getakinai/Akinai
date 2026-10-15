import { useMemo } from 'react'
import { FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { countryTimezones, timezoneSelectOptions } from '~/lib/timezones'
import { type CustomerLocationOptions } from '../_types'

type LocationFieldsProps = {
  options: CustomerLocationOptions | undefined
  isLoading?: boolean
  countryCode: string
  timezone: string
  onCountryChange: (countryCode: string) => void
  onTimezoneChange: (timezone: string) => void
  errors: FieldErrors
  /** The country already on the profile; kept selectable after its market is archived. */
  savedCountry?: Country | null
}

type Country = { code: string; name: string }

/** Adds the saved country when it is no longer in the allowed list. */
export function withSavedCountry(countries: Country[], saved: Country | null): Country[] {
  if (!saved || countries.some(({ code }) => code === saved.code)) return countries
  return [...countries, saved].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Country of origin (only countries the store sells to) and timezone, as
 * two sibling fields; the parent decides the layout. The timezones follow
 * the chosen country, and changing the country selects its first timezone.
 */
export default function LocationFields({
  options,
  isLoading = false,
  countryCode,
  timezone,
  onCountryChange,
  onTimezoneChange,
  errors,
  savedCountry = null,
}: LocationFieldsProps) {
  const countryOptions = useMemo(
    () =>
      withSavedCountry(options?.countries ?? [], savedCountry).map(({ code, name }) => ({
        value: code,
        label: name,
      })),
    [options, savedCountry]
  )
  const timezoneOptions = useMemo(
    () => timezoneSelectOptions(countryTimezones(options, countryCode), timezone),
    [options, countryCode, timezone]
  )

  function changeCountry(next: string) {
    onCountryChange(next)
    const nextTimezone = countryTimezones(options, next)[0] ?? ''
    if (nextTimezone !== timezone) onTimezoneChange(nextTimezone)
  }

  return (
    <>
      <FormSelectWithSearch
        name="countryCode"
        label="Country"
        placeholder="Choose your country"
        searchPlaceholder="Search countries…"
        noOptionsText="We don’t sell to any countries yet"
        options={countryOptions}
        value={countryCode}
        onChange={changeCountry}
        isLoading={isLoading}
        error={errors.countryCode}
      />
      <FormSelectWithSearch
        name="timezone"
        label="Timezone"
        placeholder="Choose your timezone"
        searchPlaceholder="Search timezones…"
        options={timezoneOptions}
        value={timezone}
        onChange={onTimezoneChange}
        isLoading={isLoading}
        error={errors.timezone}
      />
    </>
  )
}
