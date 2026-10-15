import vine from '@vinejs/vine'
import { PERMISSIONS } from '#abilities/permissions'

export const adminRolePermissionUpdateValidator = vine.create({
  permission: vine.enum(PERMISSIONS),
  granted: vine.boolean({ strict: true }),
})
