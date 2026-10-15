import { useState } from 'react'
import { format, startOfDay, subDays } from 'date-fns'
import {
  DateRangeCalendarPicker,
  FormSelectWithSearch,
  formatDateRangeToYmd,
  parseDateRangeFromYmd,
} from '~/components/form'
import {
  AnalyticsCompareSchema,
  AnalyticsPresetSchema,
  type AnalyticsPreset,
  type AnalyticsQuery,
} from './_types'

const PRESET_OPTIONS: { value: AnalyticsPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'last_365', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
]

const COMPARE_OPTIONS = [
  { value: 'previous_period', label: 'Previous period' },
  { value: 'previous_year', label: 'Previous year' },
  { value: 'none', label: 'No comparison' },
]

const PRESET_DAYS: Record<Exclude<AnalyticsPreset, 'custom' | 'last_30'>, number> = {
  today: 1,
  last_7: 7,
  last_90: 90,
  last_365: 365,
}

const ymd = (date: Date) => format(date, 'yyyy-MM-dd')

/** Last 30 days is the server default, so it sends no dates and uses the store timezone. */
function presetRange(preset: AnalyticsPreset): Pick<AnalyticsQuery, 'from' | 'to'> | null {
  if (preset === 'custom') return null
  if (preset === 'last_30') return { from: null, to: null }
  const today = startOfDay(new Date())
  return { from: ymd(subDays(today, PRESET_DAYS[preset] - 1)), to: ymd(today) }
}

type DateRangeControlProps = {
  value: AnalyticsQuery
  onChange: (query: AnalyticsQuery) => void
  /** Hides the comparison picker (e.g. reports that ignore the range). */
  disabled?: boolean
}

/** Date range presets, a custom range calendar and the comparison period. */
export default function DateRangeControl({ value, onChange, disabled }: DateRangeControlProps) {
  const [preset, setPreset] = useState<AnalyticsPreset>(
    value.from || value.to ? 'custom' : 'last_30'
  )
  const custom = parseDateRangeFromYmd(value.from, value.to)

  return (
    <div className="flex w-full flex-wrap items-end gap-2.5 sm:w-auto">
      <FormSelectWithSearch
        name="analytics-range"
        label="Date range"
        hideLabel
        compact
        disabled={disabled}
        className="w-full min-w-[10rem] sm:w-auto"
        value={preset}
        options={PRESET_OPTIONS}
        onChange={(next) => {
          const chosen = AnalyticsPresetSchema.parse(next)
          setPreset(chosen)
          const range = presetRange(chosen)
          if (range) onChange({ ...value, ...range })
        }}
      />
      {preset === 'custom' && (
        <DateRangeCalendarPicker
          name="analytics-custom-range"
          label="Custom date range"
          hideLabel
          compact
          closeOnSelect
          months={2}
          disabled={disabled}
          className="w-full sm:w-auto sm:min-w-[15rem]"
          placeholder="Pick dates"
          value={custom}
          onChange={(range) => {
            const { dateFrom, dateTo } = formatDateRangeToYmd(range)
            onChange({ ...value, from: dateFrom, to: dateTo })
          }}
        />
      )}
      <FormSelectWithSearch
        name="analytics-compare"
        label="Compare to"
        hideLabel
        compact
        disabled={disabled}
        className="w-full min-w-[10rem] sm:w-auto"
        value={value.compare}
        options={COMPARE_OPTIONS}
        onChange={(next) => onChange({ ...value, compare: AnalyticsCompareSchema.parse(next) })}
      />
    </div>
  )
}
