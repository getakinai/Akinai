import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { AuditLogSchema } from '../_audit_types'
import { AdminUserSchema, AdminUserStatusSchema, USER_STATUSES } from '../_types'

export const ADMIN_USERS_SORT_KEYS = ['fullName', 'email', 'createdAt'] as const

export const AdminUsersSortKeySchema = z.enum(ADMIN_USERS_SORT_KEYS)

export type AdminUsersSortKey = z.infer<typeof AdminUsersSortKeySchema>

export const AdminUserStatusFilterSchema = z.enum(['', ...USER_STATUSES])

export type AdminUserStatusFilter = z.infer<typeof AdminUserStatusFilterSchema>

export const AdminUsersListQuerySchema = z.object({
  q: z.string(),
  status: AdminUserStatusFilterSchema,
  roleId: z.union([z.literal(''), z.uuid()]),
  sort: AdminUsersSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminUsersListQuery = z.infer<typeof AdminUsersListQuerySchema>

export const AdminUsersListResponseSchema = paginatedResponse(AdminUserSchema)

export const AdminUserResponseSchema = z.object({ data: AdminUserSchema })

export const AdminUserStoreResponseSchema = AdminUserResponseSchema

export const AdminRoleOptionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  isLocked: z.boolean(),
  isDefault: z.boolean(),
})

export type AdminRoleOption = z.infer<typeof AdminRoleOptionSchema>

export const AdminRoleOptionsResponseSchema = z.object({ data: z.array(AdminRoleOptionSchema) })

export const AdminUserActivityResponseSchema = paginatedResponse(AuditLogSchema)

export const AdminUserCreateFormSchema = z
  .object({
    fullName: z.string().trim().max(255).nullable(),
    email: z.email('Enter a valid email address'),
    password: z.string().min(12, 'Password must have at least 12 characters').max(128),
    passwordConfirmation: z.string(),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type AdminUserCreateForm = z.infer<typeof AdminUserCreateFormSchema>

export const AdminUserUpdateFormSchema = z.object({
  fullName: z.string().trim().max(255).nullable(),
  email: z.email('Enter a valid email address').max(254),
  status: AdminUserStatusSchema,
  roleId: z.uuid('Choose a role'),
})

export type AdminUserUpdateForm = z.infer<typeof AdminUserUpdateFormSchema>
