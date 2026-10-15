import { hasRegions, regionOptions, regionsFor } from '~/lib/country_regions'
import FormInput from './form_input'
import FormSelectWithSearch from './form_select_with_search'

export type RegionValue = {
  province: string
  /** Catalog code (e.g. `PH-CEB`); empty when the country has no list. */
  regionCode: string
}

type FormRegionFieldProps = {
  name: string
  countryCode: string
  value: RegionValue
  onChange: (value: RegionValue) => void
  error?: string
  required?: boolean
  disabled?: boolean
  /** Label for countries without a province list. */
  freeTextLabel?: string
}

/**
 * Province picker for countries with a region list (e.g. the Philippines),
 * so shipping zones can match it exactly. Other countries get a text field.
 */
export default function FormRegionField({
  name,
  countryCode,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  freeTextLabel = 'Region',
}: FormRegionFieldProps) {
  if (!hasRegions(countryCode)) {
    return (
      <FormInput
        name={name}
        label={freeTextLabel}
        required={required}
        disabled={disabled}
        autoComplete="address-level1"
        value={value.province}
        onChange={(event) => onChange({ province: event.target.value, regionCode: '' })}
        error={error}
      />
    )
  }

  return (
    <FormSelectWithSearch
      name={name}
      label="Province"
      required={required}
      disabled={disabled}
      placeholder="Select a province"
      searchPlaceholder="Search provinces…"
      options={regionOptions(countryCode)}
      value={value.regionCode}
      onChange={(code) => {
        const region = regionsFor(countryCode).find((item) => item.code === code)
        onChange({ province: region?.name ?? '', regionCode: region?.code ?? '' })
      }}
      error={error}
    />
  )
}
