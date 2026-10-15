import vine from '@vinejs/vine'
import { USER_STATUSES } from '#models/user'

/**
 * `meta.userId` is the User being edited so their email does not clash
 * with itself.
 */
export const adminUserUpdateValidator = vine.withMetaData<{ userId: string }>().create({
  fullName: vine.string().trim().maxLength(255).nullable(),
  email: vine
    .string()
    .trim()
    .toLowerCase()
    .email()
    .maxLength(254)
    .unique(async (db, value, field) => {
      const row = await db
        .from('users')
        .where('email', value)
        .whereNot('id', field.meta.userId as string)
        .first()
      return !row
    }),
  status: vine.enum(USER_STATUSES),
  roleId: vine.string().uuid().exists({ table: 'roles', column: 'id' }),
})
