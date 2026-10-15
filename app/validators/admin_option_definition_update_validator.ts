import vine from '@vinejs/vine'

export const adminOptionDefinitionUpdateValidator = vine
  .withMetaData<{ definitionId: string }>()
  .create({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(64)
      .unique(async (db, value, field) => {
        const row = await db
          .from('option_definitions')
          .whereRaw('lower(name) = ?', [value.toLowerCase()])
          .whereNot('id', field.meta.definitionId)
          .first()
        return !row
      }),
  })
