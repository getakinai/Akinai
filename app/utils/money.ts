import type { CurrencyDisplay } from '#constants/store_settings'

export type MoneyFormat = {
  currencyCode: string
  currencyDisplay: CurrencyDisplay
  locale: string
}

/**
 * Server-side twin of `inertia/lib/money.ts` `formatMoney`, for emails.
 * Falls back to `NZD 12.50` when the locale or currency is not supported.
 */
export function formatMoney(
  amount: number,
  { currencyCode, currencyDisplay, locale }: MoneyFormat
): string {
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

/** Rounds to cents, avoiding binary float drift (`0.1 + 0.2`). */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
