import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import User from '#models/user'

/**
 * `created`, `placed`, `paid`, `fulfilled` and `fulfill_cancelled` are
 * order events written explicitly by the order services (see
 * AuditLogService.recordOrderEvent).
 */
export const SECURITY_ACTIONS = [
  'logged_in',
  'login_failed',
  'login_blocked',
  'logged_out',
  'mfa_enabled',
  'mfa_disabled',
  'mfa_failed',
  'password_changed',
  'password_reset',
  'access_denied',
  'setup_completed',
  'setup_failed',
  'products_exported',
  'products_imported',
  'collections_exported',
  'product_types_exported',
  'vendors_exported',
  'options_exported',
  'locations_exported',
  'analytics_report_exported',
  'impersonation_started',
  'impersonation_stopped',
  'maintenance_enabled',
  'maintenance_disabled',
] as const

export const AUDIT_ACTIONS = [
  'updated',
  'deleted',
  'created',
  'placed',
  'paid',
  'payment_submitted',
  'fulfilled',
  'fulfill_cancelled',
  'notified',
  'note_added',
  'resent',
  'cancelled',
  'refunded',
  'return_requested',
  'return_approved',
  'return_declined',
  'return_received',
  'return_cancelled',
  ...SECURITY_ACTIONS,
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type SecurityAction = (typeof SECURITY_ACTIONS)[number]

/** Security events that may signal an attack; logged at `warn` for alerting. */
export const SECURITY_ALERT_ACTIONS: readonly SecurityAction[] = [
  'login_failed',
  'login_blocked',
  'mfa_failed',
  'access_denied',
  'setup_failed',
  'impersonation_started',
  'maintenance_enabled',
  'maintenance_disabled',
]

export type OrderEventAction = Extract<
  AuditAction,
  | 'created'
  | 'placed'
  | 'paid'
  | 'payment_submitted'
  | 'updated'
  | 'fulfilled'
  | 'fulfill_cancelled'
  | 'notified'
  | 'note_added'
  | 'cancelled'
  | 'refunded'
  | 'return_requested'
  | 'return_approved'
  | 'return_declined'
  | 'return_received'
  | 'return_cancelled'
>

export type AuditValue =
  string | number | boolean | null | AuditValue[] | { [key: string]: AuditValue }

export type AuditReferenceLabel = {
  before: string | null
  after: string | null
}

/**
 * `before`/`after` hold only the changed attributes for `updated`, and the
 * full record (minus hidden attributes) in `before` for `deleted`.
 * `labels` maps foreign-key attributes to the readable name of the record
 * they pointed to when the change was made.
 */
export type AuditChanges = {
  before: Record<string, AuditValue>
  after: Record<string, AuditValue> | null
  labels?: Record<string, AuditReferenceLabel>
}

/**
 * A destructive change (update or delete) to a record, written by the
 * audit hooks on BaseAppModel, or a security event (`SECURITY_ACTIONS`:
 * sign-ins, failures, MFA and password changes, denied access). Made by a staff User (`userId`) or by a storefront Customer in
 * their own account (`customerId`). Never audited itself.
 */
export default class AuditLog extends BaseAppModel {
  static auditable = false

  @column()
  declare userId: string | null

  @column()
  declare customerId: string | null

  @column()
  declare action: AuditAction

  @column()
  declare auditableType: string

  @column()
  declare auditableId: string

  @column()
  declare auditableLabel: string | null

  @column()
  declare changes: AuditChanges

  @column()
  declare ipAddress: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
