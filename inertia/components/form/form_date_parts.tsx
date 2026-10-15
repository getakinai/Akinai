import { useState } from 'react'
import { field } from '~/lib/styles'
import FormInputNumber from './form_input_number'
import FormSelect from './form_select'

type FormDatePartsProps = {
  name: string
  label: string
  /** ISO date (`yyyy-MM-dd`), or an empty string. */
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

const monthNames = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' })

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: monthNames.format(new Date(Date.UTC(2000, index, 1))),
}))

function parse(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return { year: null, month: '', day: null }
  return { year: Number(match[1]), month: String(Number(match[2])), day: Number(match[3]) }
}

/**
 * Returns the ISO date, or an empty string until the parts form a real
 * calendar date.
 */
function toIsoDate(year: number | null, month: string, day: number | null): string {
  if (!year || !month || !day) return ''
  const date = new Date(Date.UTC(year, Number(month) - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCDate() !== day) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * A date entered as separate month, day and year fields, e.g. a date of
 * birth. Remount with a new `key` to reset it from `value`.
 */
export default function FormDateParts({
  name,
  label,
  value,
  onChange,
  error,
  disabled = false,
}: FormDatePartsProps) {
  const initial = parse(value)
  const [month, setMonth] = useState(initial.month)
  const [day, setDay] = useState<number | null>(initial.day)
  const [year, setYear] = useState<number | null>(initial.year)

  function update(next: { month?: string; day?: number | null; year?: number | null }) {
    const nextMonth = next.month ?? month
    const nextDay = next.day === undefined ? day : next.day
    const nextYear = next.year === undefined ? year : next.year
    setMonth(nextMonth)
    setDay(nextDay)
    setYear(nextYear)
    onChange(toIsoDate(nextYear, nextMonth, nextDay))
  }

  return (
    <fieldset className={field.wrapper} disabled={disabled}>
      <legend className={`${field.label} mb-1.5`}>{label}</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <FormSelect
          name={`${name}Month`}
          label={`${label} month`}
          hideLabel
          placeholder="Month"
          options={MONTH_OPTIONS}
          value={month}
          disabled={disabled}
          onChange={(event) => update({ month: event.target.value })}
        />
        <FormInputNumber
          name={`${name}Day`}
          label={`${label} day`}
          hideLabel
          placeholder="Day"
          maxLength={2}
          value={day}
          onChange={(next) => update({ day: next })}
        />
        <FormInputNumber
          name={`${name}Year`}
          label={`${label} year`}
          hideLabel
          placeholder="Year"
          maxLength={4}
          value={year}
          onChange={(next) => update({ year: next })}
        />
      </div>
      {error && <span className={field.error}>{error}</span>}
    </fieldset>
  )
}
