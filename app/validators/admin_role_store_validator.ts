import vine from '@vinejs/vine'

export const adminRoleStoreValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(64)
    .unique(async (db, value) => {
      const row = await db.from('roles').whereRaw('lower(name) = ?', [value.toLowerCase()]).first()
      return !row
    }),
  description: vine.string().trim().maxLength(255).nullable(),
})
