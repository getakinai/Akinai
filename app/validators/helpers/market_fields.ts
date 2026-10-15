import vine from '@vinejs/vine'
import { ownedCountryCodesSchema } from '#validators/helpers/country_codes'

/**
 * Fields shared by the market store and update validators. `meta.marketId`
 * (when set) is the market being edited so it does not clash with itself.
 */
export function marketFields() {
  return {
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const marketId = field.meta.marketId as string | undefined
        const query = db.from('markets').whereRaw('lower(name) = ?', [value.toLowerCase()])
        if (marketId) query.whereNot('id', marketId)
        return !(await query.first())
      }),
    currencyCode: vine
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/),
    pricesIncludeTax: vine.boolean({ strict: true }),
    countryCodes: ownedCountryCodesSchema({
      table: 'market_countries',
      ownerColumn: 'market_id',
      ownerMetaKey: 'marketId',
      ownerLabel: 'market',
    }),
  }
}
