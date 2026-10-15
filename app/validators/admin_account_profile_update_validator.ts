import vine from '@vinejs/vine'
import { currentPasswordSchema } from '#validators/helpers/customer_password'

/**
 * The signed-in User's own name and email. `meta.userId` keeps the email
 * from clashing with itself. `currentPassword` is checked by the service
 * when the email changes.
 */
export const adminAccountProfileUpdateValidator = vine.withMetaData<{ userId: string }>().create({
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
  currentPassword: currentPasswordSchema().optional(),
})
