import vine from '@vinejs/vine'

export const adminOptionDefinitionValueUpdateValidator = vine
  .withMetaData<{ definitionId: string; valueId: string }>()
  .create({
    value: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(64)
      .unique(async (db, value, field) => {
        const row = await db
          .from('option_definition_values')
          .where('option_definition_id', field.meta.definitionId)
          .whereRaw('lower(value) = ?', [value.toLowerCase()])
          .whereNot('id', field.meta.valueId)
          .first()
        return !row
      }),
  })
