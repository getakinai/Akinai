import vine from '@vinejs/vine'

export const adminOptionDefinitionStoreValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(64)
    .unique(async (db, value) => {
      const row = await db
        .from('option_definitions')
        .whereRaw('lower(name) = ?', [value.toLowerCase()])
        .first()
      return !row
    }),
})
