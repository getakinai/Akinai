import type { AdminEventType } from '#constants/admin_events'
import type { AuditChanges, AuditValue, OrderEventAction } from '#models/audit_log'
import type Order from '#models/order'
import { orderAuditLabel } from '#services/order_audit'
import { formatMoney } from '#utils/money'

/**
 * What staff see for an order event. `title` follows the actor's name
 * ("**Jane Cruz** fulfilled #F1 on order #1042").
 */
export type PresentedEvent = {
  type: AdminEventType
  title: string
  details: Record<string, AuditValue>
}

const RETURN_TYPES = {
  return_requested: ['return.requested', 'requested return'],
  return_approved: ['return.approved', 'approved return'],
  return_declined: ['return.declined', 'declined return'],
  return_received: ['return.received', 'received return'],
  return_cancelled: ['return.cancelled', 'cancelled return'],
} as const satisfies Partial<Record<OrderEventAction, readonly [AdminEventType, string]>>

/** `partially_refunded` → `partially refunded`. */
function statusLabel(value: AuditValue | undefined): string {
  return typeof value === 'string' ? value.replaceAll('_', ' ') : 'unknown'
}

function text(value: AuditValue | undefined): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/**
 * Turns an order audit event into a staff notification. Null for events
 * staff don't need pinging about (emails sent, draft edits, staff notes,
 * edits that don't change payment or fulfillment status).
 */
export function presentOrderEvent(
  order: Order,
  action: OrderEventAction,
  changes: AuditChanges
): PresentedEvent | null {
  if (order.status === 'draft') return null
  const label = orderAuditLabel(order)
  const before = changes.before
  const after = changes.after ?? {}
  const details: Record<string, AuditValue> = {
    before,
    after,
    currencyCode: order.currencyCode,
  }
  const event = (type: AdminEventType, title: string): PresentedEvent => ({
    type,
    title,
    details,
  })

  switch (action) {
    case 'placed':
      return event(
        'order.placed',
        `placed order ${label} · ${formatMoney(order.total, {
          currencyCode: order.currencyCode,
          currencyDisplay: 'symbol',
          locale: 'en-US',
        })}`
      )
    case 'paid':
      return event('order.paid', `recorded payment for order ${label}`)
    case 'payment_submitted':
      return event('order.payment_submitted', `sent proof of payment for order ${label}`)
    case 'fulfilled':
      return event(
        'order.fulfilled',
        `fulfilled ${text(after.fulfillment)} on order ${label} (${statusLabel(after.fulfillmentStatus)})`
      )
    case 'fulfill_cancelled':
      return event(
        'order.fulfillment_cancelled',
        `cancelled fulfillment ${text(after.fulfillment)} on order ${label}`
      )
    case 'cancelled':
      return event(
        'order.cancelled',
        `cancelled order ${label}${after.cancelReason ? ` (${statusLabel(after.cancelReason)})` : ''}`
      )
    case 'refunded': {
      const amount = typeof after.refund === 'number' ? after.refund : 0
      return event(
        'order.refunded',
        `refunded ${formatMoney(amount, {
          currencyCode: order.currencyCode,
          currencyDisplay: 'symbol',
          locale: 'en-US',
        })} on order ${label}`
      )
    }
    case 'updated':
      if ('fulfillmentStatus' in after && before.fulfillmentStatus !== after.fulfillmentStatus) {
        return event(
          'order.fulfillment_status_changed',
          `marked order ${label} as ${statusLabel(after.fulfillmentStatus)}`
        )
      }
      if ('paymentStatus' in after && before.paymentStatus !== after.paymentStatus) {
        return event(
          'order.payment_status_changed',
          after.refundFailed
            ? `reported a failed refund on order ${label} (${statusLabel(after.paymentStatus)})`
            : `changed payment on order ${label} to ${statusLabel(after.paymentStatus)}`
        )
      }
      return null
    case 'note_added':
      return after.reply === true
        ? event('order.note_replied', `replied to a note on order ${label}`)
        : null
    case 'return_requested':
    case 'return_approved':
    case 'return_declined':
    case 'return_received':
    case 'return_cancelled': {
      const [type, verb] = RETURN_TYPES[action]
      return event(type, `${verb} ${text(after.return)} on order ${label}`)
    }
    default:
      return null
  }
}
