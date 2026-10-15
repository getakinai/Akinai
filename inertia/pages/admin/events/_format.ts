import { type BadgeTone } from '~/lib/styles'
import { type AdminEventType } from '../_notification_types'
import { type AdminEvent, type AdminEventStatus } from './_types'

export const eventTypeLabels: Record<AdminEventType, string> = {
  'order.placed': 'Order placed',
  'order.paid': 'Order paid',
  'order.payment_submitted': 'Payment proof sent',
  'order.payment_status_changed': 'Payment status changed',
  'order.fulfillment_status_changed': 'Fulfillment status changed',
  'order.fulfilled': 'Items fulfilled',
  'order.fulfillment_cancelled': 'Fulfillment cancelled',
  'order.cancelled': 'Order cancelled',
  'order.refunded': 'Refund issued',
  'order.note_replied': 'Customer replied to note',
  'return.requested': 'Return requested',
  'return.approved': 'Return approved',
  'return.declined': 'Return declined',
  'return.received': 'Return received',
  'return.cancelled': 'Return cancelled',
  'support.ticket_created': 'Support request',
  'support.ticket_replied': 'Support reply',
}

export const eventStatusMeta: Record<AdminEventStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  delivered: { label: 'Delivered', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

function humanizeKey(key: string) {
  const spaced = key.replaceAll(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

export type EventChangeRow = { key: string; label: string; before: string; after: string }

/** Before/after rows for the details dialog; ids are left out. */
export function eventChangeRows(details: AdminEvent['details']): EventChangeRow[] {
  const before = details.before ?? {}
  const after = details.after ?? {}
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (key) => key !== 'id' && !key.endsWith('Id')
  )
  return keys.map((key) => ({
    key,
    label: humanizeKey(key),
    before: displayValue(before[key]),
    after: displayValue(after[key]),
  }))
}
