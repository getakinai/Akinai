import { z } from 'zod'

export const USER_STATUSES = ['active', 'pending', 'inactive'] as const

export const AdminUserStatusSchema = z.enum(USER_STATUSES)

export type AdminUserStatus = z.infer<typeof AdminUserStatusSchema>

export const AdminUserRoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  isLocked: z.boolean(),
})

export type AdminUserRole = z.infer<typeof AdminUserRoleSchema>

export const AdminUserSchema = z.object({
  id: z.uuid(),
  fullName: z.string().nullable(),
  email: z.email(),
  status: AdminUserStatusSchema,
  roleId: z.uuid().nullable(),
  role: AdminUserRoleSchema.nullable(),
  initials: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminUser = z.infer<typeof AdminUserSchema>

export const AdminMeSchema = AdminUserSchema.extend({
  permissions: z.array(z.string()),
})

export type AdminMe = z.infer<typeof AdminMeSchema>

export const AdminMeResponseSchema = z.object({ data: AdminMeSchema })

/**
 * A market staff enter prices for. The primary market holds the base
 * prices; the others need their own prices on variants and shipping rates.
 */
export const PricingMarketSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  currencyCode: z.string(),
  isPrimary: z.boolean(),
})

export type PricingMarket = z.infer<typeof PricingMarketSchema>

export const PricingMarketsResponseSchema = z.object({ data: z.array(PricingMarketSchema) })

/** Same limits as `app/constants/csv_transfer.ts`. */
export const CSV_IMPORT_MAX_BYTES = 2 * 1024 * 1024

export const CSV_IMPORT_MAX_ROWS = 1000

export const CsvImportErrorSchema = z.object({
  row: z.number(),
  field: z.string().nullable(),
  message: z.string(),
})

export const CsvImportResultSchema = z.object({
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errorCount: z.number(),
  errors: z.array(CsvImportErrorSchema),
})

export const CsvImportResponseSchema = z.object({ data: CsvImportResultSchema })

export type CsvImportResult = z.infer<typeof CsvImportResultSchema>
