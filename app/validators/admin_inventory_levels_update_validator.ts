import vine from '@vinejs/vine'

export const adminInventoryLevelsUpdateValidator = vine.create({
  levels: vine
    .array(
      vine.object({
        locationId: vine
          .string()
          .uuid()
          .exists(async (db, value) => {
            const row = await db
              .from('locations')
              .where('id', value)
              .where('is_active', true)
              .first()
            return Boolean(row)
          }),
        available: vine.number({ strict: true }).withoutDecimals().min(0).max(1_000_000_000),
      })
    )
    .minLength(1)
    .distinct('locationId'),
})
