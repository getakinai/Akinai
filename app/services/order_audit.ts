import type { AuditChanges, AuditValue } from '#models/audit_log'
import type Order from '#models/order'

/** Order attributes shown in the order's activity log. */
const ORDER_AUDIT_FIELDS = [
  'paymentStatus',
  'customerId',
  'email',
  'shippingAddress',
  'discountCode',
  'shippingDiscountCode',
  'shippingTitle',
  'subtotal',
  'discountTotal',
  'shippingDiscountTotal',
  'shippingTotal',
  'taxTotal',
  'total',
  'calculatedTotal',
  'totalOverrideReason',
] as const

type AuditLine = { productTitle: string; variantTitle: string | null; quantity: number }

export type OrderAuditSnapshot = Record<string, AuditValue>

export function orderAuditLabel(order: Pick<Order, 'orderNumber' | 'draftNumber'>): string {
  return `#${order.orderNumber ?? `D${order.draftNumber}`}`
}

/** `"Shirt · Red × 2"` per line; products without options skip the placeholder title. */
export function orderLineSummary(lines: AuditLine[]): string[] {
  return lines.map(({ productTitle, variantTitle, quantity }) => {
    const title =
      variantTitle && variantTitle !== 'Default Title'
        ? `${productTitle} · ${variantTitle}`
        : productTitle
    return `${title} × ${quantity}`
  })
}

function toAuditValue(value: unknown): AuditValue {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as AuditValue
}

export function orderAuditSnapshot(order: Order, lines: AuditLine[]): OrderAuditSnapshot {
  return {
    ...Object.fromEntries(ORDER_AUDIT_FIELDS.map((key) => [key, toAuditValue(order[key])])),
    lineItems: orderLineSummary(lines),
  }
}

/** Changes for a `created` event: the snapshot without empty fields. */
export function createdChanges(order: Order, lines: AuditLine[]): AuditChanges {
  const snapshot = orderAuditSnapshot(order, lines)
  return {
    before: {},
    after: Object.fromEntries(
      Object.entries(snapshot).filter(
        ([, value]) => value !== null && !(Array.isArray(value) && value.length === 0)
      )
    ),
  }
}

/** Changes for a `placed` event; `order` needs its `lineItems` preloaded. */
export function placedChanges(order: Order): AuditChanges {
  return {
    before: {},
    after: {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      lineItems: orderLineSummary(order.lineItems),
    },
  }
}

/** The fields that differ between two snapshots; null when nothing changed. */
export function orderAuditDiff(
  before: OrderAuditSnapshot,
  after: OrderAuditSnapshot
): AuditChanges | null {
  const keys = Object.keys(after).filter(
    (key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)
  )
  if (keys.length === 0) return null
  return {
    before: Object.fromEntries(keys.map((key) => [key, before[key] ?? null])),
    after: Object.fromEntries(keys.map((key) => [key, after[key] ?? null])),
  }
}
