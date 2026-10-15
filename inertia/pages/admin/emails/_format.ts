import { type BadgeTone } from '~/lib/styles'
import { type EmailStatus, type EmailType } from './_types'

export const emailTypeLabels: Record<EmailType, string> = {
  customer_signup_code: 'Sign-up code',
  customer_password_reset_code: 'Password reset code',
  customer_password_changed: 'Password changed',
  customer_account_exists: 'Account already exists',
  customer_email_changed: 'Email changed',
  order_confirmation: 'Order confirmation',
  order_payment_received: 'Payment received',
  order_shipped: 'Shipping confirmation',
  order_shipping_updated: 'Shipping update',
  order_cancelled: 'Order cancelled',
  order_refunded: 'Refund issued',
  order_note_added: 'Order note',
  order_payment_rejected: 'Payment proof rejected',
  return_requested: 'Return requested',
  return_approved: 'Return approved',
  return_declined: 'Return declined',
  staff_order_placed: 'New order (staff)',
  staff_return_requested: 'Return requested (staff)',
  staff_payment_submitted: 'Payment proof (staff)',
  staff_order_note_replied: 'Note reply (staff)',
  support_ticket_received: 'Support request received',
  support_ticket_replied: 'Support reply',
  staff_support_ticket_created: 'New support request (staff)',
  staff_support_ticket_replied: 'Support reply (staff)',
  other: 'Other',
}

export const emailStatusMeta: Record<EmailStatus, { label: string; tone: BadgeTone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export function recipientsSummary(addresses: string[]) {
  if (addresses.length === 0) return '—'
  if (addresses.length === 1) return addresses[0]
  return `${addresses[0]} +${addresses.length - 1}`
}
