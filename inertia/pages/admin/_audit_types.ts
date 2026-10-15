import { z } from 'zod'

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

export const AuditActionSchema = z.enum([
  'updated',
  'deleted',
  'created',
  'placed',
  'paid',
  'fulfilled',
  'fulfill_cancelled',
  'notified',
  'note_added',
  'payment_submitted',
  'resent',
  'cancelled',
  'refunded',
  'return_requested',
  'return_approved',
  'return_declined',
  'return_received',
  'return_cancelled',
  ...SECURITY_ACTIONS,
])

export type AuditAction = z.infer<typeof AuditActionSchema>

export type SecurityAction = (typeof SECURITY_ACTIONS)[number]

export const AuditLogSchema = z.object({
  id: z.uuid(),
  action: AuditActionSchema,
  auditableType: z.string(),
  auditableId: z.uuid(),
  auditableLabel: z.string().nullable(),
  changes: z.object({
    before: z.record(z.string(), z.unknown()),
    after: z.record(z.string(), z.unknown()).nullable(),
    labels: z
      .record(z.string(), z.object({ before: z.string().nullable(), after: z.string().nullable() }))
      .optional(),
  }),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
})

export type AuditLog = z.infer<typeof AuditLogSchema>

export const ActivityActorSchema = z.object({
  kind: z.enum(['staff', 'customer', 'system']),
  name: z.string(),
})

export type ActivityActor = z.infer<typeof ActivityActorSchema>

/** A record's audit log entry with who made it. */
export const RecordActivitySchema = AuditLogSchema.extend({ actor: ActivityActorSchema })

export type RecordActivity = z.infer<typeof RecordActivitySchema>

/** Filters for the back-office activity feeds; dates are `yyyy-MM-dd`. */
export const ActivityFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  action: AuditActionSchema.optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
})

export type ActivityFilters = z.infer<typeof ActivityFiltersSchema>

export const ActivityListQuerySchema = ActivityFiltersSchema.extend({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>
