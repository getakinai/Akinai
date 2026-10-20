import { z } from 'zod'

export const AdminRoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  isLocked: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  permissions: z.array(z.string()),
  userCount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminRole = z.infer<typeof AdminRoleSchema>

export const PermissionResourceSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  actions: z.array(z.string()),
  adminOnly: z.boolean(),
})

export type PermissionResource = z.infer<typeof PermissionResourceSchema>

export const PermissionSectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  resources: z.array(PermissionResourceSchema),
})

export const RoleMatrixSchema = z.object({
  actions: z.array(z.string()),
  sections: z.array(PermissionSectionSchema),
  roles: z.array(AdminRoleSchema),
})

export type RoleMatrix = z.infer<typeof RoleMatrixSchema>

export const RoleMatrixResponseSchema = z.object({ data: RoleMatrixSchema })

export const AdminRoleResponseSchema = z.object({ data: AdminRoleSchema })

export const AdminRoleDeleteResponseSchema = z.null()

export const AdminRoleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must have at least 2 characters')
    .max(64, 'Name must have at most 64 characters'),
  description: z.string().trim().max(255).nullable(),
})

export type AdminRoleForm = z.infer<typeof AdminRoleFormSchema>

export const RolePermissionToggleSchema = z.object({
  roleId: z.uuid(),
  permission: z.string(),
  granted: z.boolean(),
})

export type RolePermissionToggle = z.infer<typeof RolePermissionToggleSchema>
