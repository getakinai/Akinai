import vine from '@vinejs/vine'

export const adminLocationUpdateValidator = vine.withMetaData<{ locationId: string }>().create({
  name: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(100)
    .unique(async (db, value, field) => {
      const row = await db
        .from('locations')
        .whereRaw('lower(name) = ?', [value.toLowerCase()])
        .whereNot('id', field.meta.locationId)
        .first()
      return !row
    }),
  addressLine: vine.string().trim().maxLength(255).nullable(),
  city: vine.string().trim().maxLength(100).nullable(),
  country: vine.string().trim().maxLength(100).nullable(),
})
