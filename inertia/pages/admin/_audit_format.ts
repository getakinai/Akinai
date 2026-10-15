import { type BadgeTone } from '~/lib/styles'
import {
  SECURITY_ACTIONS,
  type AuditAction,
  type AuditLog,
  type SecurityAction,
} from './_audit_types'

export type AuditSide = 'before' | 'after'

export type AuditFieldChange = {
  key: string
  label: string
  before: string
  after: string | null
}

export const auditActionMeta: Record<AuditAction, { label: string; tone: BadgeTone }> = {
  updated: { label: 'Updated', tone: 'info' },
  deleted: { label: 'Deleted', tone: 'danger' },
  logged_in: { label: 'Signed in', tone: 'success' },
  login_failed: { label: 'Sign-in failed', tone: 'warning' },
  login_blocked: { label: 'Sign-in blocked', tone: 'danger' },
  logged_out: { label: 'Signed out', tone: 'neutral' },
  mfa_enabled: { label: '2FA on', tone: 'success' },
  mfa_disabled: { label: '2FA off', tone: 'warning' },
  mfa_failed: { label: 'Wrong code', tone: 'warning' },
  password_changed: { label: 'Password changed', tone: 'info' },
  password_reset: { label: 'Password reset', tone: 'info' },
  access_denied: { label: 'Access denied', tone: 'danger' },
  setup_completed: { label: 'Store set up', tone: 'success' },
  setup_failed: { label: 'Setup failed', tone: 'warning' },
  products_exported: { label: 'Products exported', tone: 'info' },
  products_imported: { label: 'Products imported', tone: 'info' },
  collections_exported: { label: 'Collections exported', tone: 'info' },
  product_types_exported: { label: 'Product types exported', tone: 'info' },
  vendors_exported: { label: 'Vendors exported', tone: 'info' },
  options_exported: { label: 'Options exported', tone: 'info' },
  locations_exported: { label: 'Locations exported', tone: 'info' },
  analytics_report_exported: { label: 'Report exported', tone: 'info' },
  impersonation_started: { label: 'Impersonation started', tone: 'warning' },
  impersonation_stopped: { label: 'Impersonation ended', tone: 'neutral' },
  maintenance_enabled: { label: 'Store offline', tone: 'warning' },
  maintenance_disabled: { label: 'Store online', tone: 'success' },
  created: { label: 'Created', tone: 'neutral' },
  placed: { label: 'Placed', tone: 'success' },
  paid: { label: 'Payment received', tone: 'success' },
  fulfilled: { label: 'Fulfilled', tone: 'success' },
  fulfill_cancelled: { label: 'Fulfillment cancelled', tone: 'warning' },
  notified: { label: 'Notification sent', tone: 'neutral' },
  note_added: { label: 'Note added', tone: 'info' },
  payment_submitted: { label: 'Payment submitted', tone: 'info' },
  resent: { label: 'Resent', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'warning' },
  return_requested: { label: 'Return requested', tone: 'info' },
  return_approved: { label: 'Return approved', tone: 'success' },
  return_declined: { label: 'Return declined', tone: 'warning' },
  return_received: { label: 'Return received', tone: 'success' },
  return_cancelled: { label: 'Return cancelled', tone: 'neutral' },
}

/** Actions recorded against an order, in the order filter's display order. */
export const ORDER_ACTIVITY_ACTIONS: AuditAction[] = [
  'created',
  'placed',
  'updated',
  'paid',
  'payment_submitted',
  'fulfilled',
  'fulfill_cancelled',
  'notified',
  'note_added',
  'refunded',
  'cancelled',
  'return_requested',
  'return_approved',
  'return_declined',
  'return_received',
  'return_cancelled',
  'deleted',
]

/** Actions recorded against a product and its variants. */
export const PRODUCT_ACTIVITY_ACTIONS: AuditAction[] = ['created', 'updated', 'deleted']

/** Every action, for feeds that mix record changes and security events. */
export const ALL_ACTIVITY_ACTIONS = Object.keys(auditActionMeta) as AuditAction[]

export function isSecurityAction(action: AuditAction): action is SecurityAction {
  return (SECURITY_ACTIONS as readonly string[]).includes(action)
}

const securitySummaries: Record<SecurityAction, string> = {
  logged_in: 'Signed in',
  login_failed: 'Entered a wrong password',
  login_blocked: 'Sign-in blocked after too many attempts',
  logged_out: 'Signed out',
  mfa_enabled: 'Turned on 2FA',
  mfa_disabled: 'Turned off 2FA',
  mfa_failed: 'Entered a wrong verification code',
  password_changed: 'Changed their password',
  password_reset: 'Reset their password',
  access_denied: 'Tried to open a page without permission',
  setup_completed: 'Created the first admin account',
  setup_failed: 'Entered a wrong setup token',
  products_exported: 'Exported products to CSV',
  products_imported: 'Imported products from CSV',
  collections_exported: 'Exported collections to CSV',
  product_types_exported: 'Exported product types to CSV',
  vendors_exported: 'Exported vendors to CSV',
  options_exported: 'Exported options to CSV',
  locations_exported: 'Exported locations to CSV',
  analytics_report_exported: 'Downloaded an analytics report',
  impersonation_started: 'Signed in to the storefront as a customer',
  impersonation_stopped: 'Stopped impersonating a customer',
  maintenance_enabled: 'Turned on maintenance mode',
  maintenance_disabled: 'Turned off maintenance mode',
}

/** One-line description of a security event (sign-ins, MFA, denied access). */
export function securitySummary(action: SecurityAction) {
  return securitySummaries[action]
}

/** Events that record the new values only (no meaningful "before"). */
const EVENT_ACTIONS: readonly AuditAction[] = [
  'created',
  'placed',
  'payment_submitted',
  'fulfilled',
  'fulfill_cancelled',
  'notified',
  'resent',
  'cancelled',
  'refunded',
  'return_requested',
  'return_approved',
  'return_declined',
  'return_received',
  'return_cancelled',
]

export function isEventAction(action: AuditAction) {
  return EVENT_ACTIONS.includes(action)
}

const eventTitles: Partial<Record<AuditAction, (type: string) => string>> = {
  created: (type) => `Created ${type}`,
  placed: (type) => `Placed ${type}`,
  paid: () => 'Payment received',
  payment_submitted: () => 'Proof of payment sent',
  fulfilled: () => 'Items fulfilled',
  fulfill_cancelled: () => 'Fulfillment cancelled',
  notified: () => 'Notification sent',
  resent: (type) => `Resent ${type}`,
  cancelled: (type) => `Cancelled ${type}`,
  refunded: () => 'Refund issued',
  return_requested: () => 'Return requested',
  return_approved: () => 'Return approved',
  return_declined: () => 'Return declined',
  return_received: () => 'Returned items received',
  return_cancelled: () => 'Return cancelled',
}

export function auditTitle(log: AuditLog) {
  if (isSecurityAction(log.action)) return securitySummary(log.action)
  const type = recordTypeLabel(log.auditableType).toLowerCase()
  return eventTitles[log.action]?.(type) ?? `${auditActionMeta[log.action].label} ${type}`
}

const recordTypeLabels: Record<string, string> = {
  User: 'Staff user',
  RolePermission: 'Permission',
  ProductVariant: 'Variant',
  ProductOption: 'Product option',
  ProductOptionValue: 'Product option value',
  ProductVariantOptionValue: 'Variant option',
  OptionDefinition: 'Shared option',
  OptionDefinitionValue: 'Shared option value',
  InventoryLevel: 'Stock level',
  Order: 'Order',
}

const fieldLabels: Record<string, string> = {
  addressLine: 'Address',
  address1: 'Address line 1',
  address2: 'Address line 2',
  countryCode: 'Country',
  fullName: 'Name',
  isActive: 'Active',
  sortOrder: 'Display order',
  lineItems: 'Products',
  totalOverrideReason: 'Override reason',
  calculatedTotal: 'Calculated total',
  shippingTitle: 'Shipping',
  trackingCompany: 'Carrier',
  archivedAt: 'Archived',
}

const ENUM_FIELDS = new Set([
  'status',
  'action',
  'type',
  'kind',
  'paymentStatus',
  'paymentMethod',
  'fulfillmentStatus',
])

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function sentenceCase(value: string) {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_.-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function recordTypeLabel(type: string) {
  return recordTypeLabels[type] ?? sentenceCase(type)
}

/**
 * `roleId` → "Role", `isDefault` → "Default", `postalCode` → "Postal code".
 */
export function fieldLabel(key: string) {
  if (fieldLabels[key]) return fieldLabels[key]
  const withoutId = key.endsWith('Id') ? key.slice(0, -2) : key
  const withoutIs = /^is[A-Z]/.test(withoutId) ? withoutId.slice(2) : withoutId
  return sentenceCase(withoutIs)
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Empty'
  if (value === '[hidden]') return 'Hidden'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) {
    return value.length === 0 ? 'Empty' : value.map((item) => formatValue(key, item)).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([entryKey, entry]) => `${fieldLabel(entryKey)}: ${formatValue(entryKey, entry)}`)
      .join(', ')
  }

  const text = String(value)
  if (UUID_PATTERN.test(text)) return 'Unknown record'
  if (ISO_DATE_PATTERN.test(text) && !Number.isNaN(Date.parse(text))) {
    return dateTimeFormat.format(new Date(text))
  }
  if (ENUM_FIELDS.has(key)) return sentenceCase(text)
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text
      .replaceAll(/<[^>]+>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
  }
  return text
}

/**
 * Readable value for one side of a change. Foreign keys use the record
 * name captured when the change was made.
 */
export function auditValue(log: AuditLog, key: string, side: AuditSide) {
  const label = log.changes.labels?.[key]?.[side]
  if (label) return label
  const source = side === 'before' ? log.changes.before : log.changes.after
  return formatValue(key, source?.[key])
}

export function auditFieldChanges(log: AuditLog): AuditFieldChange[] {
  const keys = Object.keys(log.changes.after ?? log.changes.before)
  return keys.map((key) => ({
    key,
    label: fieldLabel(key),
    before: auditValue(log, key, 'before'),
    after: log.changes.after ? auditValue(log, key, 'after') : null,
  }))
}

export function auditRecordName(log: AuditLog) {
  return log.auditableLabel ?? 'Untitled'
}

export function formatAuditDate(value: string) {
  return dateTimeFormat.format(new Date(value))
}
