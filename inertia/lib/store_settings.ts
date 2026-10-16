/**
 * Option lists for store settings. Keep in sync with
 * `app/constants/store_settings.ts`.
 */
/**
 * New Zealand business structures (NZBN / Inland Revenue).
 */
export const BUSINESS_TYPES = [
  'sole_trader',
  'partnership',
  'limited_partnership',
  'limited_company',
  'trust',
  'charitable_trust',
  'incorporated_society',
  'cooperative_company',
  'maori_authority',
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]

export const SOLE_TRADER: BusinessType = 'sole_trader'

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  sole_trader: 'Sole trader',
  partnership: 'Partnership',
  limited_partnership: 'Limited partnership',
  limited_company: 'Limited liability company',
  trust: 'Trust',
  charitable_trust: 'Charitable trust',
  incorporated_society: 'Incorporated society',
  cooperative_company: 'Co-operative company',
  maori_authority: 'Māori authority',
}

export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPES.map((value) => ({
  value,
  label: BUSINESS_TYPE_LABELS[value],
}))

export const CURRENCY_DISPLAYS = ['symbol', 'narrowSymbol', 'code', 'name'] as const

export type CurrencyDisplay = (typeof CURRENCY_DISPLAYS)[number]

export const CURRENCY_DISPLAY_LABELS: Record<CurrencyDisplay, string> = {
  symbol: 'Symbol',
  narrowSymbol: 'Narrow symbol',
  code: 'Currency code',
  name: 'Currency name',
}

export const DATE_FORMATS = ['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'] as const

export type DateFormat = (typeof DATE_FORMATS)[number]

export const LOCALES = [
  'en-PH',
  'fil-PH',
  'en-US',
  'en-GB',
  'en-AU',
  'en-NZ',
  'en-CA',
  'en-SG',
  'ja-JP',
  'ko-KR',
  'zh-CN',
  'de-DE',
  'fr-FR',
  'es-ES',
] as const

export type Locale = (typeof LOCALES)[number]

const localeNames = new Intl.DisplayNames(['en'], { type: 'language' })

export const LOCALE_OPTIONS = LOCALES.map((value) => ({
  value,
  label: `${localeNames.of(value) ?? value} (${value})`,
}))

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const

export type UnitSystem = (typeof UNIT_SYSTEMS)[number]

export const UNIT_SYSTEM_OPTIONS = [
  { value: 'metric', label: 'Metric system' },
  { value: 'imperial', label: 'Imperial system' },
]

export const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz'] as const

export type WeightUnit = (typeof WEIGHT_UNITS)[number]

export const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
]

function timezoneOffset(timeZone: string): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(new Date())
    .find(({ type }) => type === 'timeZoneName')
  return part?.value.replace('GMT', '') || '+00:00'
}

function offsetMinutes(offset: string): number {
  const [hours, minutes] = offset.slice(1).split(':').map(Number)
  const total = hours * 60 + (minutes || 0)
  return offset.startsWith('-') ? -total : total
}

/**
 * IANA time zones labelled with their current UTC offset, e.g.
 * `(GMT+08:00) Asia/Manila`, sorted by offset.
 */
export const TIMEZONE_OPTIONS = Intl.supportedValuesOf('timeZone')
  .map((value) => {
    const offset = timezoneOffset(value)
    return {
      value,
      minutes: offsetMinutes(offset),
      label: `(GMT${offset}) ${value.replaceAll('_', ' ')}`,
      searchText: `${value} GMT${offset}`,
    }
  })
  .sort((a, b) => a.minutes - b.minutes || a.value.localeCompare(b.value))
  .map(({ value, label, searchText }) => ({ value, label, searchText }))

/** Checkout delivery text shown when staff haven't set their own. */
export const DEFAULT_CHECKOUT_DELIVERY_HEADING = 'Your delivery address'

export const DEFAULT_CHECKOUT_DELIVERY_NOTE =
  'Enter the address and recipient details for this order.'

export const MAX_CHECKOUT_DELIVERY_HEADING = 120

export const MAX_CHECKOUT_DELIVERY_NOTE = 500
