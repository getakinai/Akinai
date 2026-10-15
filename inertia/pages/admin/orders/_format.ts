import { countryName } from '~/lib/countries'
import { formatDateTime, type DateFormatContext } from '~/lib/date'
import { type BadgeTone } from '~/lib/styles'
import {
  type OrderAddress,
  type OrderFulfillmentStatus,
  type OrderPaymentStatus,
  type OrderStatus,
} from './_types'

export function formatMoney(amount: number, currencyCode: string) {
  if (!currencyCode) return amount.toFixed(2)
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(
      amount
    )
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

export function draftLabel(draftNumber: number) {
  return `#D${draftNumber}`
}

export function orderLabel(order: { orderNumber: number | null; draftNumber: number }) {
  return order.orderNumber === null ? draftLabel(order.draftNumber) : `#${order.orderNumber}`
}

export const paymentStatusMeta: Record<OrderPaymentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Payment pending', tone: 'warning' },
  payment_submitted: { label: 'Payment submitted', tone: 'info' },
  partially_refunded: { label: 'Partially refunded', tone: 'info' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  voided: { label: 'Voided', tone: 'neutral' },
}

export const PAYMENT_FILTER_OPTIONS = [
  { value: '', label: 'All payments' },
  ...(Object.keys(paymentStatusMeta) as OrderPaymentStatus[]).map((status) => ({
    value: status,
    label: paymentStatusMeta[status].label,
  })),
]

export const cancelReasonLabels: Record<string, string> = {
  customer: 'Customer changed or cancelled the order',
  inventory: 'Items unavailable',
  fraud: 'Fraudulent order',
  declined: 'Payment declined',
  other: 'Other',
}

export const fulfillmentStatusMeta: Record<
  OrderFulfillmentStatus,
  { label: string; tone: BadgeTone }
> = {
  unfulfilled: { label: 'Unfulfilled', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  on_hold: { label: 'On hold', tone: 'danger' },
  partially_fulfilled: { label: 'Partially fulfilled', tone: 'info' },
  fulfilled: { label: 'Fulfilled', tone: 'success' },
}

export type OrderState =
  | 'draft'
  | 'cancelled'
  | 'pending'
  | 'payment_submitted'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided'
  | 'open'

export const orderStateMeta: Record<
  OrderState,
  { label: string; description: string; tone: BadgeTone }
> = {
  draft: {
    label: 'Draft',
    description: 'This order has not been placed yet.',
    tone: 'neutral',
  },
  pending: {
    label: 'Payment pending',
    description: 'The order is placed and awaiting payment.',
    tone: 'warning',
  },
  payment_submitted: {
    label: 'Payment submitted',
    description: 'The customer sent proof of payment. Check your bank account, then review it.',
    tone: 'info',
  },
  paid: {
    label: 'Paid',
    description: 'Payment has been received for this order.',
    tone: 'success',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order was cancelled and can no longer be fulfilled or edited.',
    tone: 'danger',
  },
  partially_refunded: {
    label: 'Partially refunded',
    description: 'Part of the payment has been refunded.',
    tone: 'info',
  },
  refunded: {
    label: 'Refunded',
    description: 'The full payment has been refunded.',
    tone: 'neutral',
  },
  voided: {
    label: 'Voided',
    description: 'No payment is expected for this order.',
    tone: 'neutral',
  },
  open: {
    label: 'Open',
    description: 'The order is placed.',
    tone: 'info',
  },
}

export function orderState(order: {
  status: OrderStatus
  paymentStatus: OrderPaymentStatus | null
}): OrderState {
  if (order.status === 'draft') return 'draft'
  if (order.status === 'cancelled') return 'cancelled'
  return order.paymentStatus ?? 'open'
}

/** Placed / cancelled / refund times in the store zone (pass `useDateFormat().ctx`). */
export function formatOrderDate(value: string | null, ctx: DateFormatContext) {
  if (!value) return '—'
  return formatDateTime(value, ctx)
}

export function orderAddressLines(address: OrderAddress): string[] {
  const locality = [address.city, address.province, address.postalCode].filter(Boolean).join(', ')
  return [
    address.fullName,
    address.company,
    address.address1,
    address.address2,
    locality,
    countryName(address.countryCode),
    address.phone,
  ].filter((line): line is string => Boolean(line))
}

/** Variant title worth showing; products without options have a placeholder one. */
export function variantTitle(title: string | null) {
  return title && title !== 'Default Title' ? title : null
}

export function variantLabel(line: { productTitle: string; variantTitle: string | null }) {
  const title = variantTitle(line.variantTitle)
  return title ? `${line.productTitle} · ${title}` : line.productTitle
}
