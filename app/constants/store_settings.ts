/**
 * Option lists for store settings. Keep in sync with
 * `inertia/lib/store_settings.ts`.
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

/**
 * The only structure that trades under the owner's own name, so it has no
 * separate legal name.
 */
export const SOLE_TRADER: BusinessType = 'sole_trader'

export type BusinessType = (typeof BUSINESS_TYPES)[number]

export const CURRENCY_DISPLAYS = ['symbol', 'narrowSymbol', 'code', 'name'] as const

export type CurrencyDisplay = (typeof CURRENCY_DISPLAYS)[number]

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

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const

export type UnitSystem = (typeof UNIT_SYSTEMS)[number]

export const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz'] as const

export type WeightUnit = (typeof WEIGHT_UNITS)[number]

export const CURRENCY_CODES: readonly string[] = Intl.supportedValuesOf('currency')

export const TIMEZONES: readonly string[] = Intl.supportedValuesOf('timeZone')

const TIMEZONE_SET = new Set(TIMEZONES)

/**
 * IANA timezones used in a country (ISO 3166-1 alpha-2), from the ICU
 * data bundled with Node. Falls back to every timezone when ICU has none.
 */
export function timezonesForCountry(countryCode: string): string[] {
  const zones = (new Intl.Locale(`und-${countryCode}`).getTimeZones() ?? []).filter((zone) =>
    TIMEZONE_SET.has(zone)
  )
  return zones.length > 0 ? zones : [...TIMEZONES]
}

export const STORE_SETTING_DEFAULTS = {
  storeName: 'My store',
  currencyCode: 'NZD',
  currencyDisplay: 'symbol',
  locale: 'en-NZ',
  dateFormat: 'dd/MM/yyyy',
  timezone: 'Pacific/Auckland',
  unitSystem: 'metric',
  weightUnit: 'kg',
} as const satisfies {
  storeName: string
  currencyCode: string
  currencyDisplay: CurrencyDisplay
  locale: Locale
  dateFormat: DateFormat
  timezone: string
  unitSystem: UnitSystem
  weightUnit: WeightUnit
}

/** Staff addresses that get new order alerts (falls back to the owner email). */
export const MAX_ORDER_NOTIFICATION_EMAILS = 5

/** Days after delivery that customers can request a return. 0 turns requests off. */
export const DEFAULT_RETURN_WINDOW_DAYS = 30
export const MAX_RETURN_WINDOW_DAYS = 365
