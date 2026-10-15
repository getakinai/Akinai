import { type BadgeTone } from '~/lib/styles'
import { type AdminVariant, type ProductStatus } from './_types'

export const productStatusMeta: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
}

const priceFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPrice(value: number) {
  return priceFormat.format(value)
}

export function formatPriceRange(min: number | null, max: number | null) {
  if (min === null || max === null) return '—'
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
}

export function variantLabel({
  title,
  optionValues,
}: Pick<AdminVariant, 'title' | 'optionValues'>) {
  if (optionValues.length === 0) return title
  return optionValues.map(({ optionName, value }) => `${value} ${optionName}`).join(' / ')
}

export const FREE_SHIPPING_HINT =
  'When every item in a cart ships free, the cheapest shipping rate costs nothing. Faster rates keep their price.'
