/** Email logs older than this are deleted by `node ace emails:prune`. */
export const EMAIL_LOG_RETENTION_DAYS = 90

/**
 * Every email type the store sends. Kept in one list so the monitor's type
 * filter and labels stay in sync with the mail classes.
 */
export const EMAIL_TYPES = [
  'customer_signup_code',
  'customer_password_reset_code',
  'customer_password_changed',
  'customer_account_exists',
  'customer_email_changed',
  'order_confirmation',
  'order_payment_received',
  'order_shipped',
  'order_shipping_updated',
  'order_cancelled',
  'order_refunded',
  'order_note_added',
  'order_payment_rejected',
  'return_requested',
  'return_approved',
  'return_declined',
  'staff_order_placed',
  'staff_return_requested',
  'staff_payment_submitted',
  'staff_order_note_replied',
  'support_ticket_received',
  'support_ticket_replied',
  'staff_support_ticket_created',
  'staff_support_ticket_replied',
  'other',
] as const

export type EmailType = (typeof EMAIL_TYPES)[number]
