import vine from '@vinejs/vine'
import { notBelowMinRule } from '#validators/helpers/min_max_rule'

export const MAX_MARKET_PRICES = 20

const amount = () => vine.number({ strict: true }).min(0).max(9_999_999_999.99).decimal([0, 2])

/**
 * Prices in non-primary markets, one per market. Optional: leaving it out
 * keeps the saved prices; an empty list removes them all.
 */
export const variantMarketPricesSchema = () =>
  vine
    .array(
      vine.object({
        marketId: vine.string().uuid(),
        price: amount(),
        compareAtPrice: amount().nullable(),
      })
    )
    .maxLength(MAX_MARKET_PRICES)
    .distinct('marketId')
    .optional()

/**
 * `minSubtotal` / `maxSubtotal` limit the rate in that market, in the
 * market's currency (e.g. free over 50 USD). Missing means no limit.
 */
export const shippingRateMarketPricesSchema = () =>
  vine
    .array(
      vine.object({
        marketId: vine.string().uuid(),
        price: amount(),
        minSubtotal: amount().nullable().optional(),
        maxSubtotal: amount()
          .use(notBelowMinRule({ minKey: 'minSubtotal' }))
          .nullable()
          .optional(),
      })
    )
    .maxLength(MAX_MARKET_PRICES)
    .distinct('marketId')
    .optional()
