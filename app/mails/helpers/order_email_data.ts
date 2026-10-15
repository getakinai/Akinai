import { DateTime } from 'luxon'
import type Order from '#models/order'
import type { OrderAddress } from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type StoreSetting from '#models/store_setting'
import { orderAuditLabel } from '#services/order_audit'
import { absoluteUrl } from '#utils/app_url'
import { formatMoney, type MoneyFormat } from '#utils/money'

export type OrderEmailItem = {
  title: string
  detail: string | null
  quantity: number
  amount: string
}

export type OrderEmailTotal = { label: string; amount: string; strong: boolean }

/** A titled box of label/value rows (bank details, tracking, refund…). */
export type OrderEmailBlock = {
  heading: string
  rows: { label: string; value: string }[]
  note: string | null
  link: { label: string; url: string } | null
}

/** Plain, pre-formatted data for `emails/order` and `emails/order_text`. */
export type OrderEmailData = {
  title: string
  lines: string[]
  orderLabel: string
  placedOn: string | null
  blocks: OrderEmailBlock[]
  items: OrderEmailItem[]
  itemsHeading: string
  totals: OrderEmailTotal[]
  shippingAddress: string[]
  actionUrl: string | null
  actionLabel: string | null
  footer: string
}

export type OrderEmailContent = {
  title: string
  lines: string[]
  blocks?: OrderEmailBlock[]
  /** Defaults to every line on the order. */
  items?: { line: OrderLineItem; quantity: number; amount?: number }[]
  itemsHeading?: string
  /** Hide the order totals (e.g. a shipment or a return that covers some items). */
  hideTotals?: boolean
  action?: { label: string; url: string } | null
  footer?: string
}

const DEFAULT_FOOTER = 'Reply to this email if you have any questions about your order.'

export function moneyFormatFor(
  order: Pick<Order, 'currencyCode'>,
  settings: Pick<StoreSetting, 'currencyDisplay' | 'locale'>
): MoneyFormat {
  return {
    currencyCode: order.currencyCode,
    currencyDisplay: settings.currencyDisplay,
    locale: settings.locale,
  }
}

/**
 * The order page in the customer's account, or null for guests (they have
 * no account to open it in).
 */
export function customerOrderUrl(order: Order): string | null {
  const hasAccount = Boolean(order.customerId && order.customer?.account)
  return hasAccount ? absoluteUrl(`/account/orders/${order.id}`) : null
}

export function staffOrderUrl(order: Pick<Order, 'id'>): string {
  return absoluteUrl(`/admin/orders/show/${order.id}`)
}

export function storeUrl(): string {
  return absoluteUrl('/')
}

export function countryLabel(countryCode: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

export function addressLines(address: OrderAddress | null, locale: string): string[] {
  if (!address) return []
  return [
    address.fullName,
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
    countryLabel(address.countryCode, locale),
  ].filter((line): line is string => Boolean(line && line.trim()))
}

export function formatOrderDate(
  value: DateTime | null,
  settings: Pick<StoreSetting, 'timezone' | 'locale'>
): string | null {
  if (!value) return null
  return value
    .setZone(settings.timezone)
    .setLocale(settings.locale)
    .toLocaleString(DateTime.DATE_MED)
}

function itemFrom(line: OrderLineItem, quantity: number, amount: number, money: MoneyFormat) {
  return {
    title: line.productTitle,
    detail:
      [line.variantTitle, line.sku ? `SKU ${line.sku}` : null].filter(Boolean).join(' · ') || null,
    quantity,
    amount: formatMoney(amount, money),
  }
}

export function orderTotals(order: Order, money: MoneyFormat): OrderEmailTotal[] {
  const totals: OrderEmailTotal[] = [
    { label: 'Subtotal', amount: formatMoney(order.subtotal, money), strong: false },
  ]
  if (order.discountTotal > 0) {
    totals.push({
      label: order.discountCode ? `Discount (${order.discountCode})` : 'Discount',
      amount: `−${formatMoney(order.discountTotal, money)}`,
      strong: false,
    })
  }
  if (order.shippingTitle) {
    totals.push({
      label: `Shipping (${order.shippingTitle})`,
      amount: formatMoney(order.shippingTotal + order.shippingDiscountTotal, money),
      strong: false,
    })
  }
  if (order.shippingDiscountTotal > 0) {
    totals.push({
      label: order.shippingDiscountTitle
        ? `Free shipping (${order.shippingDiscountTitle})`
        : 'Free shipping',
      amount: `−${formatMoney(order.shippingDiscountTotal, money)}`,
      strong: false,
    })
  }
  if (order.taxTotal > 0) {
    totals.push({
      label: order.pricesIncludeTax
        ? `${order.taxName ?? 'Tax'} (included)`
        : (order.taxName ?? 'Tax'),
      amount: formatMoney(order.taxTotal, money),
      strong: false,
    })
  }
  totals.push({ label: 'Total', amount: formatMoney(order.total, money), strong: true })
  if (order.refundedTotal > 0) {
    totals.push({
      label: 'Refunded',
      amount: `−${formatMoney(order.refundedTotal, money)}`,
      strong: false,
    })
    totals.push({
      label: 'Net',
      amount: formatMoney(order.total - order.refundedTotal, money),
      strong: true,
    })
  }
  return totals
}

/**
 * Builds the template data for an order email. Expects `lineItems` (and
 * `customer.account` for the account link) preloaded.
 */
export function orderEmailData(
  order: Order,
  settings: StoreSetting,
  content: OrderEmailContent
): OrderEmailData {
  const money = moneyFormatFor(order, settings)
  const items = content.items
    ? content.items.map(({ line, quantity, amount }) =>
        itemFrom(line, quantity, amount ?? line.unitPrice * quantity, money)
      )
    : order.lineItems.map((line) => itemFrom(line, line.quantity, line.lineTotal, money))

  return {
    title: content.title,
    lines: content.lines,
    orderLabel: `Order ${orderAuditLabel(order)}`,
    placedOn: formatOrderDate(order.completedAt, settings),
    blocks: content.blocks ?? [],
    items,
    itemsHeading: content.itemsHeading ?? 'Order summary',
    totals: content.hideTotals ? [] : orderTotals(order, money),
    shippingAddress: addressLines(order.shippingAddress, settings.locale),
    actionUrl: content.action?.url ?? null,
    actionLabel: content.action?.label ?? null,
    footer: content.footer ?? DEFAULT_FOOTER,
  }
}
