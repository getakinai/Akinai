import vine from '@vinejs/vine'

/**
 * The market a shopper switches to. Must be an active market.
 */
export const storefrontMarketUpdateValidator = vine.create({
  handle: vine
    .string()
    .trim()
    .maxLength(100)
    .exists(async (db, value) =>
      Boolean(await db.from('markets').where('handle', value).where('is_active', true).first())
    ),
})
