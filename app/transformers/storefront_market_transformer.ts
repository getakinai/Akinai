import { BaseTransformer } from '@adonisjs/core/transformers'
import type Market from '#models/market'
import { marketCountryCode } from '#services/market_service'
import type { StorefrontMarketState } from '#services/storefront_market_service'

function summary(market: Market) {
  return {
    handle: market.handle,
    name: market.name,
    currencyCode: market.currencyCode,
    countryCode: marketCountryCode(market),
  }
}

/**
 * The shopper's market (currency, tax display), the markets they can switch
 * to and the countries orders can be delivered to.
 */
export default class StorefrontMarketTransformer extends BaseTransformer<StorefrontMarketState> {
  toObject() {
    const { current, taxRate, markets, shippingCountryCodes } = this.resource
    return {
      current: {
        ...summary(current),
        pricesIncludeTax: current.pricesIncludeTax,
        taxName: taxRate?.name ?? null,
      },
      markets: markets.map(summary),
      shippingCountryCodes,
    }
  }
}
