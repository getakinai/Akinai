import vine from '@vinejs/vine'

export const adminRoleUpdateValidator = vine.withMetaData<{ roleId: string }>().create({
  name: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(64)
    .unique(async (db, value, field) => {
      const row = await db
        .from('roles')
        .whereRaw('lower(name) = ?', [value.toLowerCase()])
        .whereNot('id', field.meta.roleId)
        .first()
      return !row
    }),
  description: vine.string().trim().maxLength(255).nullable(),
})
