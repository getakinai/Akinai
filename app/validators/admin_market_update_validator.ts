import vine from '@vinejs/vine'
import { marketFields } from '#validators/helpers/market_fields'

export const adminMarketUpdateValidator = vine.withMetaData<{ marketId: string }>().create({
  ...marketFields(),
  handle: vine
    .string()
    .trim()
    .toLowerCase()
    .maxLength(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .unique(async (db, value, field) => {
      const row = await db
        .from('markets')
        .where('handle', value)
        .whereNot('id', field.meta.marketId)
        .first()
      return !row
    }),
})
