import { formatPrice } from '../products/_format'

type Range = { min: number | null; max: number | null }

function formatRange({ min, max }: Range, format: (value: number) => string): string | null {
  if (min === null && max === null) return null
  if (max === null) return `from ${format(min ?? 0)}`
  if (min === null) return `up to ${format(max)}`
  return `${format(min)} – ${format(max)}`
}

export function formatSubtotalRange(range: Range, currencyCode?: string): string | null {
  const format = (value: number) =>
    currencyCode ? `${currencyCode} ${formatPrice(value)}` : formatPrice(value)
  return formatRange(range, format)
}

export function formatWeightRange(range: Range, unit: string): string | null {
  return formatRange(range, (value) => `${value} ${unit}`)
}

export function formatItemRange(range: Range): string | null {
  const text = formatRange(range, (value) => String(value))
  return text === null ? null : `${text} items`
}
