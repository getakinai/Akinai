import { useState } from 'react'
import { DIAL_CODES } from '~/lib/dial_codes'
import { cn, field } from '~/lib/styles'
import FormCountrySelect from './form_country_select'

type FormPhoneInputProps = {
  name: string
  label: string
  /** E.164 number (`+64272852711`), or an empty string. */
  value: string
  countryCode: string
  onChange: (value: string, countryCode: string) => void
  error?: string
  disabled?: boolean
}

/**
 * Turns what was typed into E.164. A number without `+` is read as a local
 * number for the selected country, dropping a leading trunk `0`.
 */
function toE164(raw: string, dial: string): string {
  const compact = raw.replace(/[^\d+]/g, '')
  if (compact === '' || compact === '+' || compact === dial) return ''
  if (compact.startsWith('+')) return compact
  return `${dial}${compact.replace(/^0+/, '')}`
}

/**
 * Phone number with a flag and dial-code picker. Emits E.164 values.
 */
export default function FormPhoneInput({
  name,
  label,
  value,
  countryCode,
  onChange,
  error,
  disabled = false,
}: FormPhoneInputProps) {
  const dial = DIAL_CODES[countryCode] ?? ''
  const [draft, setDraft] = useState(value)

  if (toE164(draft, dial) !== value) {
    setDraft(value)
  }

  function onCountryChange(nextCountry: string) {
    const nextDial = DIAL_CODES[nextCountry] ?? ''
    const next = dial && value.startsWith(dial) ? `${nextDial}${value.slice(dial.length)}` : value
    onChange(next, nextCountry)
  }

  return (
    <div className={field.wrapper}>
      <label className={field.label} htmlFor={name}>
        {label}
      </label>
      <div className="flex min-w-0 gap-2">
        <FormCountrySelect
          name={`${name}Country`}
          label={`${label} country`}
          hideLabel
          value={countryCode}
          disabled={disabled}
          optionSuffix={(code) => DIAL_CODES[code] ?? null}
          onChange={onCountryChange}
        />
        <input
          id={name}
          name={name}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder={dial ? `${dial} …` : '+…'}
          disabled={disabled}
          className={cn(field.input, 'min-w-0 flex-1')}
          aria-invalid={error ? 'true' : 'false'}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            onChange(toE164(event.target.value, dial), countryCode)
          }}
        />
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
