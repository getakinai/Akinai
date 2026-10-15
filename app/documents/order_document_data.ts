import type Order from '#models/order'
import type { OrderPaymentMethod, OrderPaymentStatus } from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type { BankTransferConfig } from '#models/payment_method'
import type Refund from '#models/refund'
import type StoreSetting from '#models/store_setting'
import {
  addressLines,
  countryLabel,
  formatOrderDate,
  moneyFormatFor,
  orderTotals,
  type OrderEmailTotal,
} from '#mails/helpers/order_email_data'
import { orderAuditLabel } from '#services/order_audit'
import { formatMoney, type MoneyFormat } from '#utils/money'

export type OrderDocumentKind = 'invoice' | 'receipt' | 'packing_slip'

export type OrderDocumentLine = {
  title: string
  detail: string | null
  quantity: number
  unitPrice: string | null
  amount: string | null
}

export type OrderDocumentRow = { label: string; value: string }

/** A titled list of label/value rows below the totals (payment, refunds). */
export type OrderDocumentSection = {
  heading: string
  rows: OrderDocumentRow[]
  note: string | null
}

/** Plain, pre-formatted data for one PDF. */
export type OrderDocumentData = {
  kind: OrderDocumentKind
  title: string
  /** Status label under the title, e.g. "Paid" or "Cancelled". */
  stamp: string | null
  store: { name: string; lines: string[] }
  meta: OrderDocumentRow[]
  parties: { heading: string; lines: string[] }[]
  lines: OrderDocumentLine[]
  showPrices: boolean
  totals: OrderEmailTotal[]
  sections: OrderDocumentSection[]
  footer: string
}

type MaybeRow = { label: string; value: string | null | undefined }

const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  stripe: 'Card',
  poli: 'POLi',
}

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: 'Awaiting payment',
  payment_submitted: 'Payment submitted',
  paid: 'Paid',
  partially_refunded: 'Partially refunded',
  refunded: 'Refunded',
  voided: 'Voided',
}

/**
 * Expects `lineItems` preloaded. `bank` is the account an unpaid bank
 * transfer order should be paid into.
 */
export function invoiceData(
  order: Order,
  settings: StoreSetting,
  bank: BankTransferConfig | null = null
): OrderDocumentData {
  const money = moneyFormatFor(order, settings)
  return {
    kind: 'invoice',
    title: 'Invoice',
    stamp: order.isCancelled ? 'Cancelled' : order.isPaid ? 'Paid' : null,
    store: storeBlock(settings),
    meta: rows([
      { label: 'Invoice', value: invoiceNumber(order) },
      { label: 'Order', value: orderAuditLabel(order) },
      { label: 'Date', value: formatOrderDate(order.completedAt, settings) },
      { label: 'Payment', value: paymentLabel(order) },
    ]),
    parties: parties(order, settings),
    lines: order.lineItems.map((line) => priced(line, money)),
    showPrices: true,
    totals: orderTotals(order, money),
    sections: present([bankSection(order, bank, money)]),
    footer: `Thank you for shopping with ${settings.storeName}.`,
  }
}

/** Expects `lineItems` and `refunds` preloaded, on a paid order. */
export function receiptData(order: Order, settings: StoreSetting): OrderDocumentData {
  const money = moneyFormatFor(order, settings)
  return {
    kind: 'receipt',
    title: 'Payment receipt',
    stamp: PAYMENT_STATUS_LABELS[order.paymentStatus ?? 'paid'],
    store: storeBlock(settings),
    meta: rows([
      { label: 'Receipt', value: `RCT-${order.orderNumber ?? `D${order.draftNumber}`}` },
      { label: 'Order', value: orderAuditLabel(order) },
      { label: 'Paid on', value: formatOrderDate(order.paidAt ?? order.completedAt, settings) },
      { label: 'Amount paid', value: formatMoney(order.total, money) },
    ]),
    parties: parties(order, settings).slice(0, 1),
    lines: order.lineItems.map((line) => priced(line, money)),
    showPrices: true,
    totals: orderTotals(order, money),
    sections: present([
      {
        heading: 'Payment',
        rows: rows([
          { label: 'Method', value: methodLabel(order) },
          { label: 'Reference', value: order.bankReference ?? order.paymentReference },
          { label: 'Amount', value: formatMoney(order.total, money) },
        ]),
        note: null,
      },
      refundSection(order.refunds ?? [], settings, money),
    ]),
    footer: `This receipt confirms payment received by ${settings.legalName || settings.storeName}.`,
  }
}

/** Expects `lineItems` preloaded. Lists the units still to ship, without prices. */
export function packingSlipData(order: Order, settings: StoreSetting): OrderDocumentData {
  return {
    kind: 'packing_slip',
    title: 'Packing slip',
    stamp: order.isCancelled ? 'Cancelled' : null,
    store: storeBlock(settings),
    meta: rows([
      { label: 'Order', value: orderAuditLabel(order) },
      { label: 'Date', value: formatOrderDate(order.completedAt, settings) },
      { label: 'Shipping', value: order.shippingTitle },
    ]),
    parties: parties(order, settings).slice(1),
    lines: order.lineItems.flatMap((line) => {
      const quantity = line.quantity - line.removedQuantity
      return quantity > 0 ? [{ ...lineTitle(line), quantity, unitPrice: null, amount: null }] : []
    }),
    showPrices: false,
    totals: [],
    sections: [],
    footer: `Questions about your order? Contact ${settings.contactEmail || settings.storeName}.`,
  }
}

/** `invoice-1001.pdf`, `receipt-1001.pdf`, `packing-slip-1001.pdf`. */
export function documentFilename(kind: OrderDocumentKind, order: Order): string {
  const prefix = kind === 'packing_slip' ? 'packing-slip' : kind
  return `${prefix}-${order.orderNumber ?? `D${order.draftNumber}`}.pdf`
}

function invoiceNumber(order: Order): string {
  return `INV-${order.orderNumber ?? `D${order.draftNumber}`}`
}

function rows(items: MaybeRow[]): OrderDocumentRow[] {
  return items.flatMap(({ label, value }) => (value ? [{ label, value }] : []))
}

function present<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null)
}

function filled(lines: (string | null | undefined)[]): string[] {
  return lines.filter((line): line is string => Boolean(line && line.trim()))
}

function storeBlock(settings: StoreSetting) {
  const cityLine = [settings.storeCity, settings.storeRegion, settings.storePostalCode]
    .filter(Boolean)
    .join(', ')
  return {
    name: settings.storeName,
    lines: filled([
      settings.legalName && settings.legalName !== settings.storeName ? settings.legalName : null,
      settings.storeAddressLine1,
      settings.storeSuburb,
      cityLine,
      settings.storeCountryCode ? countryLabel(settings.storeCountryCode, settings.locale) : null,
      settings.contactEmail,
      settings.phone,
    ]),
  }
}

function parties(order: Order, settings: StoreSetting) {
  const address = order.shippingAddress
  const billTo = filled([address?.fullName, order.email, address?.phone])
  const shipTo = filled([...addressLines(address, settings.locale), address?.phone])
  return [
    { heading: 'Bill to', lines: billTo.length > 0 ? billTo : ['—'] },
    { heading: 'Ship to', lines: shipTo.length > 0 ? shipTo : ['No shipping address'] },
  ]
}

function lineTitle(line: OrderLineItem) {
  const variant =
    line.variantTitle && line.variantTitle !== 'Default Title' ? line.variantTitle : null
  return {
    title: line.productTitle,
    detail: [variant, line.sku ? `SKU ${line.sku}` : null].filter(Boolean).join(' · ') || null,
  }
}

function priced(line: OrderLineItem, money: MoneyFormat): OrderDocumentLine {
  return {
    ...lineTitle(line),
    quantity: line.quantity,
    unitPrice: formatMoney(line.unitPrice, money),
    amount: formatMoney(line.lineTotal, money),
  }
}

function methodLabel(order: Order): string | null {
  return order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : null
}

function paymentLabel(order: Order): string | null {
  const status = order.paymentStatus ? PAYMENT_STATUS_LABELS[order.paymentStatus] : null
  return [methodLabel(order), status].filter(Boolean).join(' · ') || null
}

/** Where to pay, on invoices for bank transfer orders that are still unpaid. */
function bankSection(
  order: Order,
  bank: BankTransferConfig | null,
  money: MoneyFormat
): OrderDocumentSection | null {
  if (order.paymentMethod !== 'bank_transfer' || order.isPaid || order.isCancelled) return null
  return {
    heading: 'How to pay',
    rows: rows([
      { label: 'Account name', value: bank?.accountName },
      { label: 'Bank', value: bank?.bankName },
      { label: 'BSB', value: bank?.bsb },
      { label: 'Account number', value: bank?.accountNumber },
      { label: 'Reference', value: order.bankReference },
      { label: 'Amount', value: formatMoney(order.total, money) },
    ]),
    note: bank?.instructions ?? 'Use the reference above so we can match your payment.',
  }
}

function refundSection(
  refunds: Refund[],
  settings: StoreSetting,
  money: MoneyFormat
): OrderDocumentSection | null {
  const issued = refunds.filter((refund) => refund.status !== 'failed')
  if (issued.length === 0) return null
  return {
    heading: 'Refunds',
    rows: issued.map((refund) => ({
      label: filled([
        formatOrderDate(refund.createdAt, settings),
        refund.status === 'pending' ? 'pending' : null,
      ]).join(' · '),
      value: `−${formatMoney(refund.amount, money)}`,
    })),
    note: null,
  }
}
