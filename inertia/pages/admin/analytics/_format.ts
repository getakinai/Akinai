import { format, parseISO } from 'date-fns'
import { formatMoney, type MoneyFormat } from '~/lib/money'
import type { ChartDatum, ChartSeries } from '~/components/charts'
import type { AnalyticsChange, AnalyticsPoint, AnalyticsRange, MetricFormat } from './_types'

export const PREVIOUS_SUFFIX = '__previous'

export function formatMetric(
  value: number | string | null,
  metricFormat: MetricFormat,
  money: MoneyFormat,
  currencyCode?: string | null
): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  switch (metricFormat) {
    case 'money':
      return formatMoney(value, currencyCode ? { ...money, currencyCode } : money)
    case 'percent':
      return `${value.toLocaleString(money.locale, { maximumFractionDigits: 1 })}%`
    case 'hours':
      return value >= 48
        ? `${(value / 24).toLocaleString(money.locale, { maximumFractionDigits: 1 })} days`
        : `${value.toLocaleString(money.locale, { maximumFractionDigits: 1 })} h`
    case 'number':
      return value.toLocaleString(money.locale, { maximumFractionDigits: 1 })
    default:
      return String(value)
  }
}

/** Short axis/tooltip formatter: compact numbers for money and counts. */
export function axisFormatter(metricFormat: MetricFormat, money: MoneyFormat) {
  return (value: number) => {
    if (metricFormat === 'percent') return `${value.toLocaleString(money.locale)}%`
    if (metricFormat === 'hours')
      return `${value.toLocaleString(money.locale, { maximumFractionDigits: 1 })} h`
    if (metricFormat === 'money') {
      return new Intl.NumberFormat(money.locale, {
        style: 'currency',
        currency: money.currencyCode,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    }
    return value.toLocaleString(money.locale, { notation: 'compact', maximumFractionDigits: 1 })
  }
}

export function changeText(change: AnalyticsChange | null): string {
  if (!change) return ''
  if (change.percent === null) return 'New'
  if (change.percent === 0) return '0%'
  return `${change.percent > 0 ? '+' : ''}${change.percent}%`
}

const day = (value: string) => format(parseISO(value), 'd MMM yyyy')

export function rangeText(range: AnalyticsRange): string {
  const current =
    range.from === range.to ? day(range.from) : `${day(range.from)} – ${day(range.to)}`
  if (!range.previousFrom || !range.previousTo) return current
  const previous =
    range.previousFrom === range.previousTo
      ? day(range.previousFrom)
      : `${day(range.previousFrom)} – ${day(range.previousTo)}`
  return `${current} compared with ${previous}`
}

/** Flattens report points into chart rows; comparison values get a `__previous` key. */
export function chartData(points: AnalyticsPoint[]): ChartDatum[] {
  return points.map((point) => {
    const row: ChartDatum = { label: point.label, ...point.values }
    if (point.previous) {
      for (const [key, value] of Object.entries(point.previous)) {
        row[`${key}${PREVIOUS_SUFFIX}`] = value
      }
    }
    return row
  })
}

export function chartSeries(
  series: { key: string; label: string }[],
  withPrevious: boolean
): ChartSeries[] {
  return series.flatMap((item) => [
    { key: item.key, label: item.label },
    ...(withPrevious
      ? [
          {
            key: `${item.key}${PREVIOUS_SUFFIX}`,
            label: `${item.label} (comparison)`,
            compare: true,
          },
        ]
      : []),
  ])
}
