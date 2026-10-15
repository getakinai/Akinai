import { dateContextFromStore, FALLBACK_DATE_CONTEXT, formatDate, type DateInput } from '~/lib/date'
import type { CurrencyDisplay, DateFormat } from '~/lib/store_settings'

export type MoneyFormat = {
  currencyCode: string
  currencyDisplay: CurrencyDisplay
  locale: string
}

export const FALLBACK_MONEY: MoneyFormat = {
  currencyCode: 'NZD',
  currencyDisplay: 'symbol',
  locale: 'en-NZ',
}

export function formatMoney(
  amount: number,
  { currencyCode, currencyDisplay, locale }: MoneyFormat
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay,
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

/**
 * Formats a calendar date in the store time zone. Prefer `useDateFormat()` in
 * React; pass `timezone` when calling outside a component.
 */
export function formatStoreDate(
  value: DateInput,
  format: DateFormat,
  locale: string,
  timezone?: string
) {
  return formatDate(
    value,
    dateContextFromStore({
      locale,
      dateFormat: format,
      timezone: timezone ?? FALLBACK_DATE_CONTEXT.timezone,
    })
  )
}
