import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { MARKET_COOKIE } from '#constants/market'
import type Customer from '#models/customer'
import type Market from '#models/market'
import type TaxRate from '#models/tax_rate'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerRepository from '#repositories/customer_repository'
import MarketRepository from '#repositories/market_repository'
import { marketCountryCode } from '#services/market_service'
import ShippingService from '#services/shipping_service'
import TaxService from '#services/tax_service'

export type StorefrontMarketState = {
  current: Market
  taxRate: TaxRate | null
  markets: Market[]
  shippingCountryCodes: string[]
}

/**
 * The market a storefront shopper buys in. Shoppers pick it with the header
 * switcher; it sets the currency, prices and tax, while the delivery address
 * only decides shipping.
 */
@inject()
export default class StorefrontMarketService {
  constructor(
    protected marketRepository: MarketRepository,
    protected customerAccountRepository: CustomerAccountRepository,
    protected customerRepository: CustomerRepository,
    protected shippingService: ShippingService,
    protected taxService: TaxService
  ) {}

  /**
   * The cookie's market, else the signed-in customer's saved market, else
   * the primary market. Only active markets are returned.
   */
  async current(ctx: HttpContext): Promise<Market> {
    const handle = ctx.request.plainCookie(MARKET_COOKIE, { encoded: false }) as string | undefined
    if (handle) {
      const market = await this.marketRepository.findActiveWithCountries({ handle })
      if (market) return market
    }

    const account = ctx.auth.use('customer').user
    if (account) {
      const customer = await this.customerAccountRepository.loadCustomer(account)
      if (customer?.marketId) {
        const market = await this.marketRepository.findActiveWithCountries({
          id: customer.marketId,
        })
        if (market) return market
      }
    }

    const primary = await this.marketRepository.findPrimaryWithCountries()
    if (!primary) throw new Error('No primary market is configured')
    return primary
  }

  async state(ctx: HttpContext, chosen?: Market): Promise<StorefrontMarketState> {
    const [current, markets, shippingCountryCodes] = await Promise.all([
      chosen ?? this.current(ctx),
      this.marketRepository.listActiveWithCountries(),
      this.shippingService.shippableCountryCodes(),
    ])
    return { current, taxRate: await this.taxRateFor(current), markets, shippingCountryCodes }
  }

  /**
   * Switches the shopper to the market and remembers it on the customer
   * profile when signed in. Returns null for unknown or archived markets.
   */
  async choose(ctx: HttpContext, handle: string): Promise<Market | null> {
    const market = await this.marketRepository.findActiveWithCountries({ handle })
    if (!market) return null

    this.applyForCustomer(ctx, market)

    const account = ctx.auth.use('customer').user
    if (account) {
      const customer = await this.customerAccountRepository.loadCustomer(account)
      if (customer) await this.remember(customer, market)
    }
    return market
  }

  /**
   * Remembers the market in the shopper's cookie, which wins over the saved
   * `customer.marketId` in `current()`. Use after the customer's market was
   * already saved on their profile.
   */
  applyForCustomer(ctx: HttpContext, market: Market) {
    ctx.response.plainCookie(MARKET_COOKIE, market.handle, {
      encode: false,
      maxAge: '1y',
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  /**
   * The tax rate of the market's country. Markets sold to here cover one
   * country each (NZ, AU).
   */
  async taxRateFor(market: Market): Promise<TaxRate | null> {
    const countryCode = marketCountryCode(market)
    return countryCode ? this.taxService.resolve(countryCode) : null
  }

  protected async remember(customer: Customer, market: Market) {
    if (customer.marketId === market.id) return
    await this.customerRepository.setMarket(customer, market.id)
  }
}
