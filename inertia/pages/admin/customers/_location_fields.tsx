import { useMemo } from 'react'
import { FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { countryTimezones, timezoneSelectOptions } from '~/lib/timezones'
import { useAdminCustomerLocationOptions } from './_hooks'

type LocationFieldsProps = {
  countryCode: string
  timezone: string
  onCountryChange: (countryCode: string) => void
  onTimezoneChange: (timezone: string) => void
  errors: FieldErrors
  disabled?: boolean
  /** The country already on the profile; kept selectable after its market is archived. */
  savedCountry?: { code: string; name: string } | null
}

/**
 * The customer's country (limited to countries in active markets) and
 * timezone, which lists the chosen country's timezones; picking a country
 * selects its first timezone. Both can be cleared.
 */
export default function LocationFields({
  countryCode,
  timezone,
  onCountryChange,
  onTimezoneChange,
  errors,
  disabled = false,
  savedCountry = null,
}: LocationFieldsProps) {
  const options = useAdminCustomerLocationOptions()
  const countryOptions = useMemo(() => {
    const countries = options.data?.countries ?? []
    const list =
      savedCountry && !countries.some(({ code }) => code === savedCountry.code)
        ? [...countries, { ...savedCountry, name: `${savedCountry.name} (no active market)` }]
        : countries
    return list.map(({ code, name }) => ({ value: code, label: name }))
  }, [options.data, savedCountry])
  const timezoneOptions = useMemo(
    () => timezoneSelectOptions(countryTimezones(options.data, countryCode), timezone),
    [options.data, countryCode, timezone]
  )

  function changeCountry(next: string) {
    onCountryChange(next)
    if (!next) return
    const nextTimezone = countryTimezones(options.data, next)[0] ?? ''
    if (nextTimezone !== timezone) onTimezoneChange(nextTimezone)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormSelectWithSearch
        name="countryCode"
        label="Country"
        placeholder="Not set"
        searchPlaceholder="Search countries…"
        noOptionsText="No active market covers any country"
        options={countryOptions}
        value={countryCode}
        onChange={changeCountry}
        isLoading={options.isLoading}
        disabled={disabled}
        clearable
        error={errors.countryCode ?? (options.isError ? 'Could not load countries' : undefined)}
      />
      <FormSelectWithSearch
        name="timezone"
        label="Timezone"
        placeholder="Not set"
        searchPlaceholder="Search timezones…"
        options={timezoneOptions}
        value={timezone}
        onChange={onTimezoneChange}
        isLoading={options.isLoading}
        disabled={disabled}
        clearable
        error={errors.timezone}
      />
    </div>
  )
}
