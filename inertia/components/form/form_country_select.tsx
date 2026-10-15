import { ChevronsUpDown } from 'lucide-react'
import { COUNTRIES, countryFlag } from '~/lib/countries'
import { cn, field } from '~/lib/styles'

type FormCountrySelectProps = {
  name: string
  label: string
  value: string
  onChange: (code: string) => void
  /** Text shown after each country name in the list, e.g. its dial code. */
  optionSuffix?: (code: string) => string | null
  error?: string
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Compact country picker that shows the selected country's flag. A native
 * select sits on top of the flag, so keyboard and screen reader support
 * come from the browser.
 */
export default function FormCountrySelect({
  name,
  label,
  value,
  onChange,
  optionSuffix,
  error,
  hideLabel = false,
  disabled = false,
  className,
}: FormCountrySelectProps) {
  return (
    <div className={cn(field.wrapper, className)}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={name}>
        {label}
      </label>
      <div
        className={cn(
          field.input,
          'relative flex w-[60px] shrink-0 items-center justify-between gap-1 bg-paper px-2 focus-within:border-ink focus-within:ring-3 focus-within:ring-ring',
          error && 'border-danger',
          disabled && 'opacity-55'
        )}
      >
        <span aria-hidden="true" className="text-[18px] leading-none">
          {countryFlag(value) || '🌐'}
        </span>
        <ChevronsUpDown size={13} aria-hidden="true" className="text-subtle" />
        <select
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          className="absolute inset-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
          onChange={(event) => onChange(event.target.value)}
        >
          {!value && <option value="">Select a country</option>}
          {COUNTRIES.map(({ code, name: countryName }) => {
            const suffix = optionSuffix?.(code)
            return (
              <option key={code} value={code}>
                {suffix ? `${countryName} (${suffix})` : countryName}
              </option>
            )
          })}
        </select>
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
