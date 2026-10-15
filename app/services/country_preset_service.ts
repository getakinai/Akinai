import { inject } from '@adonisjs/core'
import { countryName } from '#constants/countries'
import { countryPresetFor, type CountryPreset } from '#constants/country_presets'
import type Market from '#models/market'
import MarketService from '#services/market_service'
import PriceService from '#services/price_service'
import ShippingService from '#services/shipping_service'
import StoreSettingService from '#services/store_setting_service'
import TaxService from '#services/tax_service'

/**
 * Creates the starting markets, tax rates and shipping zones for the
 * store's country of operation (`COUNTRY_PRESETS`). Only adds what is
 * missing, so it is safe to run again and never overwrites staff changes.
 */
@inject()
export default class CountryPresetService {
  constructor(
    protected storeSettingService: StoreSettingService,
    protected marketService: MarketService,
    protected taxService: TaxService,
    protected shippingService: ShippingService,
    protected priceService: PriceService
  ) {}

  /** The preset for the store's country of operation, if it has one. */
  async forStore(): Promise<CountryPreset | null> {
    const settings = await this.storeSettingService.get()
    return countryPresetFor(settings.operatingCountryCode)
  }

  /** Applies the defaults for the saved country of operation; nothing when unset. */
  async applyForStore(): Promise<void> {
    const settings = await this.storeSettingService.get()
    if (!settings.operatingCountryCode) return
    await this.apply(settings.operatingCountryCode, settings.currencyCode)
  }

  /**
   * Countries with a preset get its markets, taxes and zones. Others get a
   * primary market for the country, priced in the store currency.
   */
  async apply(countryCode: string, storeCurrencyCode: string): Promise<void> {
    const code = countryCode.toUpperCase()
    const preset = countryPresetFor(code)
    if (!preset) {
      await this.marketService.ensurePrimary({
        name: countryName(code),
        currencyCode: storeCurrencyCode,
        pricesIncludeTax: true,
        countryCodes: [code],
      })
      return
    }

    const [primary, ...others] = preset.markets
    if (primary) await this.marketService.ensurePrimary(primary)
    for (const market of others) {
      await this.marketService.ensureMarket(market)
    }
    await Promise.all(preset.taxRates.map((rate) => this.taxService.ensureRate(rate)))

    const markets = await this.priceService.pricingMarkets()
    for (const zone of preset.shippingZones) {
      await this.ensureZone(zone, markets)
    }
  }

  protected async ensureZone(zone: CountryPreset['shippingZones'][number], markets: Market[]) {
    const saved = await this.shippingService.ensureZone(
      { name: zone.name, countryCodes: zone.countryCodes, regionCodes: zone.regionCodes },
      zone.rates.map(({ name, price }) => ({
        name,
        price,
        minSubtotal: null,
        maxSubtotal: null,
        isActive: true,
      }))
    )

    for (const rate of saved.rates) {
      const prices = zone.rates.find(({ name }) => name === rate.name)?.marketPrices ?? {}
      const missing = markets.flatMap((market) => {
        const price = prices[market.currencyCode]
        if (price === undefined) return []
        if (rate.marketPrices.some(({ marketId }) => marketId === market.id)) return []
        return [{ marketId: market.id, price }]
      })
      if (missing.length === 0) continue
      await this.shippingService.syncRateMarketPrices(rate, [
        ...rate.marketPrices.map(({ marketId, price }) => ({ marketId, price })),
        ...missing,
      ])
    }
  }
}
