import type { MetricFormat } from '#services/analytics_report_service'
import { formatMoney, type MoneyFormat } from '#utils/money'

/** Server twin of the admin `formatMetric`: a report value as display text (PDF). */
export function formatAnalyticsValue(
  value: string | number | null | undefined,
  format: MetricFormat,
  money: MoneyFormat,
  currencyCode?: string | null
): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  const number = (digits: number) =>
    value.toLocaleString(money.locale, { maximumFractionDigits: digits })
  switch (format) {
    case 'money':
      return formatMoney(value, currencyCode ? { ...money, currencyCode } : money)
    case 'percent':
      return `${number(1)}%`
    case 'hours':
      return value >= 48
        ? `${(value / 24).toLocaleString(money.locale, { maximumFractionDigits: 1 })} days`
        : `${number(1)} h`
    case 'number':
      return number(2)
    default:
      return String(value)
  }
}

/** A report value for a spreadsheet: plain numbers (money to cents), no symbols. */
export function csvAnalyticsValue(
  value: string | number | null | undefined,
  format: MetricFormat
): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (format === 'money') return value.toFixed(2)
  if (format === 'percent' || format === 'hours') return String(Math.round(value * 10) / 10)
  return String(value)
}
