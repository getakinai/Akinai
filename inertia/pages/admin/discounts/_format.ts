import { type BadgeTone } from '~/lib/styles'
import { formatPrice } from '../products/_format'
import {
  type AdminDiscount,
  type DiscountAppliesTo,
  type DiscountBuyRequirement,
  type DiscountStatus,
  type DiscountType,
  type DiscountValueType,
} from './_types'

export const discountStatusMeta: Record<DiscountStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Expired', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export const discountTypeMeta: Record<DiscountType, { label: string; description: string }> = {
  amount_off_products: {
    label: 'Amount off products',
    description: 'Discount specific products or collections of products',
  },
  buy_x_get_y: {
    label: 'Buy X get Y',
    description: 'Discount specific products or collections of products',
  },
  amount_off_order: {
    label: 'Amount off order',
    description: 'Discount the total order amount',
  },
  free_shipping: {
    label: 'Free shipping',
    description: 'Offer free shipping on an order',
  },
}

const percentFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function amountText(valueType: DiscountValueType, value: number) {
  return valueType === 'percentage' ? `${percentFormat.format(value)}%` : formatPrice(value)
}

/** Short value for the list, e.g. "10% off" or "Free shipping". */
export function formatDiscountValue(
  discount: Pick<AdminDiscount, 'type' | 'valueType' | 'value' | 'buyValue' | 'getQuantity'>
) {
  if (discount.type === 'free_shipping') return 'Free shipping'
  if (discount.value === null) return '—'
  if (discount.type === 'buy_x_get_y') {
    const off =
      discount.valueType === 'percentage' && discount.value === 100
        ? 'free'
        : `${amountText(discount.valueType, discount.value)} off`
    return `Get ${discount.getQuantity ?? 1} ${off}`
  }
  return `${amountText(discount.valueType, discount.value)} off`
}

export function formatDiscountPeriod(discount: Pick<AdminDiscount, 'startsAt' | 'endsAt'>) {
  const start = dateFormat.format(new Date(discount.startsAt))
  return discount.endsAt
    ? `${start} – ${dateFormat.format(new Date(discount.endsAt))}`
    : `From ${start}`
}

/**
 * Trigger text for the active-dates picker, which can't show an open end.
 */
export function formatActiveDates(startsAt: Date, endsAt: Date | null) {
  return endsAt
    ? `${dateFormat.format(startsAt)} – ${dateFormat.format(endsAt)}`
    : `${dateFormat.format(startsAt)} – no end date`
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

function targetText(appliesTo: DiscountAppliesTo | undefined, count: number) {
  if (count === 0) return appliesTo === 'collections' ? 'chosen collections' : 'chosen products'
  return appliesTo === 'collections'
    ? plural(count, 'collection', 'collections')
    : plural(count, 'product', 'products')
}

export type DiscountSummaryInput = {
  type: DiscountType
  method: 'code' | 'automatic'
  code: string
  valueType: DiscountValueType
  value: number | null
  appliesTo: DiscountAppliesTo
  targetCount: number
  buyRequirement: DiscountBuyRequirement
  buyValue: number | null
  buyAppliesTo: DiscountAppliesTo
  buyTargetCount: number
  getQuantity: number | null
  maxUsesPerOrder: number | null
  maxShippingPrice: number | null
  minSubtotal: number | null
  usageLimit: number | null
  oncePerCustomer: boolean
  startsAt: Date
  endsAt: Date | null
}

/** Plain-language lines describing an unsaved discount, for the Summary card. */
export function discountSummary(input: DiscountSummaryInput): string[] {
  const lines: string[] = []
  lines.push(
    input.method === 'code'
      ? input.code
        ? `Code ${input.code.toUpperCase()}`
        : 'Code not set yet'
      : 'Applied automatically at checkout'
  )

  const value = input.value !== null ? amountText(input.valueType, input.value) : null
  switch (input.type) {
    case 'amount_off_order':
      if (value) lines.push(`${value} off the order`)
      break
    case 'amount_off_products':
      if (value) {
        lines.push(`${value} off ${targetText(input.appliesTo, input.targetCount)}`)
      }
      break
    case 'buy_x_get_y': {
      const buy =
        input.buyValue === null
          ? null
          : input.buyRequirement === 'quantity'
            ? plural(input.buyValue, 'item', 'items')
            : `${formatPrice(input.buyValue)} or more`
      if (buy) {
        lines.push(`Buy ${buy} from ${targetText(input.buyAppliesTo, input.buyTargetCount)}`)
      }
      if (input.getQuantity !== null && value) {
        const off =
          input.valueType === 'percentage' && input.value === 100 ? 'free' : `at ${value} off`
        lines.push(
          `Get ${plural(input.getQuantity, 'item', 'items')} ${off} from ${targetText(
            input.appliesTo,
            input.targetCount
          )}`
        )
      }
      if (input.maxUsesPerOrder !== null) {
        lines.push(`Up to ${plural(input.maxUsesPerOrder, 'use', 'uses')} per order`)
      }
      break
    }
    case 'free_shipping':
      lines.push(
        input.maxShippingPrice === null
          ? 'Free shipping on any rate'
          : `Free shipping on rates up to ${formatPrice(input.maxShippingPrice)}`
      )
      break
  }

  lines.push(
    input.minSubtotal !== null
      ? `Minimum purchase of ${formatPrice(input.minSubtotal)}`
      : 'No minimum purchase'
  )
  if (input.usageLimit !== null) lines.push(`Limited to ${plural(input.usageLimit, 'use', 'uses')}`)
  if (input.oncePerCustomer) lines.push('One use per customer')
  lines.push(
    `Active ${formatActiveDates(input.startsAt, input.endsAt).replace(' – no end date', ' onwards')}`
  )
  return lines
}
