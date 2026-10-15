import vine from '@vinejs/vine'
import { USER_STATUSES } from '#models/user'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_USERS_SORT_KEYS = ['fullName', 'email', 'createdAt'] as const

export const adminUsersListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_USERS_SORT_KEYS),
  status: vine.enum(USER_STATUSES).optional(),
  roleId: vine.string().uuid().optional(),
})
