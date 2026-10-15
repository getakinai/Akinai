import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import type Customer from '#models/customer'
import type CustomerAddress from '#models/customer_address'
import type Discount from '#models/discount'
import type Market from '#models/market'
import type Order from '#models/order'
import type { OrderAddress, OrderPaymentStatus } from '#models/order'
import type ShippingRate from '#models/shipping_rate'
import type TaxRate from '#models/tax_rate'
import CustomerAddressRepository from '#repositories/customer_address_repository'
import CustomerRepository from '#repositories/customer_repository'
import OrderRepository, {
  type OrderDraftData,
  type OrderLineData,
} from '#repositories/order_repository'
import type { MarketPrice } from '#repositories/price_repository'
import AuditLogService from '#services/audit_log_service'
import DiscountService from '#services/discount_service'
import LocationService from '#services/location_service'
import MarketService, { marketCountryCode } from '#services/market_service'
import {
  createdChanges,
  orderAuditDiff,
  orderAuditSnapshot,
  placedChanges,
} from '#services/order_audit'
import OrderNotificationService from '#services/order_notification_service'
import OrderPricingService from '#services/order_pricing_service'
import PriceService from '#services/price_service'
import { resolveRegion } from '#services/helpers/address_region'
import ShippingService from '#services/shipping_service'
import TaxService from '#services/tax_service'
import { orNullIfMissing } from '#utils/or_null_if_missing'

export type DraftOrderInput = {
  lineItems: { variantId: string; quantity: number }[]
  customerId?: string | null
  shippingAddressId?: string | null
  marketId?: string | null
  discountCode?: string | null
  shippingRateId?: string | null
}

/**
 * Pricing input with the customer and shipping address already resolved.
 * `address` may be a saved customer address (`shippingAddressId` set) or
 * one typed in at checkout.
 */
export type OrderQuoteInput = {
  lineItems: { variantId: string; quantity: number }[]
  customer: Customer | null
  address: OrderAddress | null
  shippingAddressId?: string | null
  email?: string | null
  marketId?: string | null
  discountCode?: string | null
  shippingRateId?: string | null
  /** Apply eligible automatic discounts (storefront checkout only). */
  applyAutomatic?: boolean
}

/**
 * A priced draft that has not been saved: what `calculate` returns and
 * what `create`/`update` persist.
 */
export type DraftOrderQuote = {
  data: OrderDraftData
  lines: OrderLineData[]
  market: Market
  customer: Customer | null
  /** Main discount (order, products or Buy X get Y). */
  discount: Discount | null
  shippingDiscount: Discount | null
  taxRate: TaxRate | null
  /** Rates the customer can choose for the address and cart. */
  shippingRates: ShippingRate[]
  /** False until there is a shipping address to look up tax for. */
  taxCalculated: boolean
}

type FieldError = { field: string; message: string; rule: string }

function toAddress(address: CustomerAddress): OrderAddress {
  return {
    fullName: address.fullName,
    company: address.company,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    province: address.province,
    regionCode: address.regionCode,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    phone: address.phone,
  }
}

@inject()
export default class DraftOrderService {
  constructor(
    protected orderRepository: OrderRepository,
    protected customerRepository: CustomerRepository,
    protected customerAddressRepository: CustomerAddressRepository,
    protected pricing: OrderPricingService,
    protected marketService: MarketService,
    protected discountService: DiscountService,
    protected shippingService: ShippingService,
    protected taxService: TaxService,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected priceService: PriceService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async findOrFail(id: string): Promise<Order> {
    return this.orderRepository.findOrFail(id)
  }

  async findDetailOrFail(id: string): Promise<Order> {
    return this.orderRepository.findDetailOrFail(id)
  }

  /**
   * Resolves and prices the draft without saving it. Throws a validation
   * error naming the offending field when a variant, the customer's
   * address, the market, the discount code or the shipping rate does not
   * fit the order.
   */
  async calculate(input: DraftOrderInput): Promise<DraftOrderQuote> {
    const fieldErrors: FieldError[] = []
    const fail = (field: string, message: string) =>
      fieldErrors.push({ field, message, rule: 'draftOrder' })

    const customer = input.customerId ? await this.findCustomer(input.customerId) : null
    if (input.customerId && !customer) fail('customerId', 'Choose an active customer')

    let address: CustomerAddress | null = null
    if (input.shippingAddressId) {
      address = customer ? await this.findAddress(customer.id, input.shippingAddressId) : null
      if (!address) fail('shippingAddressId', 'Choose one of this customer’s addresses')
    }

    return this.quote(
      {
        lineItems: input.lineItems,
        customer,
        address: address ? toAddress(address) : null,
        shippingAddressId: address?.id ?? null,
        marketId: input.marketId,
        discountCode: input.discountCode,
        shippingRateId: input.shippingRateId,
      },
      fieldErrors
    )
  }

  /**
   * Prices line items for an already resolved customer and address.
   * `fieldErrors` collected by the caller are thrown together with the
   * pricing errors.
   */
  async quote(input: OrderQuoteInput, fieldErrors: FieldError[] = []): Promise<DraftOrderQuote> {
    const fail = (field: string, message: string) =>
      fieldErrors.push({ field, message, rule: 'draftOrder' })
    const { customer } = input
    const address: OrderAddress | null = input.address
      ? { ...input.address, ...resolveRegion(input.address) }
      : null

    const countryCode = address?.countryCode ?? null
    const variantIds = input.lineItems.map(({ variantId }) => variantId)

    const [variants, market] = await Promise.all([
      this.orderRepository.findVariants(variantIds),
      this.resolveMarket(input.marketId ?? null, countryCode),
    ])
    if (!market) {
      fail(
        'marketId',
        input.marketId ? 'Choose an active market' : 'Create a market before creating orders'
      )
    }
    const prices = market
      ? await this.priceService.forMarket(variantIds, market)
      : new Map<string, MarketPrice>()

    const variantsById = new Map(variants.map((variant) => [variant.id, variant]))
    const lines: OrderLineData[] = []
    const productIds: string[] = []
    const cart = { weight: 0, itemCount: 0, allShipFree: true }
    input.lineItems.forEach(({ variantId, quantity }, index) => {
      const variant = variantsById.get(variantId)
      if (!variant || variant.product.status !== 'active') {
        fail(`lineItems.${index}.variantId`, 'This product is no longer available')
        return
      }
      const price = prices.get(variant.id)
      if (!price) {
        if (market)
          fail(`lineItems.${index}.variantId`, `This product isn’t sold in ${market.name}`)
        return
      }
      cart.weight += (variant.weight ?? 0) * quantity
      cart.itemCount += quantity
      cart.allShipFree &&= variant.product.freeShipping
      productIds.push(variant.product.id)
      lines.push({
        productVariantId: variant.id,
        productTitle: variant.product.title,
        variantTitle: variant.title,
        sku: variant.sku,
        unitPrice: price.price,
        quantity,
        lineTotal: 0,
        discountAllocation: 0,
        taxable: variant.product.chargeTax,
      })
    })

    const subtotal = this.pricing.price({
      lines,
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: null,
    }).subtotal

    const shippingRates = countryCode
      ? await this.shippingService.ratesFor(
          { countryCode, regionCode: address?.regionCode },
          { ...cart, subtotal, allShipFree: lines.length > 0 && cart.allShipFree },
          market
        )
      : []
    let shippingRate: ShippingRate | null = null
    if (input.shippingRateId) {
      shippingRate = shippingRates.find(({ id }) => id === input.shippingRateId) ?? null
      if (!shippingRate) {
        fail(
          'shippingRateId',
          countryCode
            ? 'This rate isn’t available for this cart'
            : 'Add a shipping address before choosing shipping'
        )
      }
    }

    const taxCountryCode = market ? marketCountryCode(market) : null
    const [taxRate, discounts] = await Promise.all([
      taxCountryCode ? this.taxService.resolve(taxCountryCode) : null,
      this.discountService.resolveForCart({
        code: input.discountCode,
        lines: lines.map((line, index) => ({
          productId: productIds[index],
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
        subtotal,
        shippingPrice: shippingRate?.price ?? null,
        customerId: customer?.id ?? null,
        applyAutomatic: input.applyAutomatic ?? false,
      }),
    ])
    if (discounts.codeError) fail('discountCode', discounts.codeError)

    if (fieldErrors.length > 0 || !market) {
      throw new errors.E_VALIDATION_ERROR(fieldErrors)
    }

    const { main, shipping } = discounts
    const totals = this.pricing.price({
      lines,
      pricesIncludeTax: market.pricesIncludeTax,
      lineDiscounts: main?.application.lineAllocations ?? null,
      shippingDiscount: shipping?.application.shippingAmount ?? 0,
      shippingPrice: shippingRate?.price ?? null,
      tax: taxRate ? { rate: taxRate.rate, appliesToShipping: taxRate.appliesToShipping } : null,
    })
    lines.forEach((line, index) => {
      line.lineTotal = totals.lineTotals[index]
      line.discountAllocation = main?.application.lineAllocations[index] ?? 0
    })
    const discount = main?.discount ?? null
    const shippingDiscount = shipping?.discount ?? null

    return {
      lines,
      market,
      customer,
      discount,
      shippingDiscount,
      taxRate,
      shippingRates,
      taxCalculated: taxCountryCode !== null,
      data: {
        customerId: customer?.id ?? null,
        email: input.email ?? customer?.email ?? null,
        shippingAddressId: input.shippingAddressId ?? null,
        shippingAddress: address,
        marketId: market.id,
        currencyCode: market.currencyCode,
        pricesIncludeTax: market.pricesIncludeTax,
        discountId: discount?.id ?? null,
        discountCode: discount?.code ?? null,
        discountTitle: discount?.title ?? null,
        shippingDiscountId: shippingDiscount?.id ?? null,
        shippingDiscountCode: shippingDiscount?.code ?? null,
        shippingDiscountTitle: shippingDiscount?.title ?? null,
        shippingDiscountTotal: totals.shippingDiscountTotal,
        shippingRateId: shippingRate?.id ?? null,
        shippingTitle: shippingRate?.name ?? null,
        shippingPrice: shippingRate?.price ?? null,
        taxName: taxRate?.name ?? null,
        taxRate: taxRate?.rate ?? null,
        taxAppliesToShipping: taxRate?.appliesToShipping ?? false,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingTotal: totals.shippingTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
      },
    }
  }

  async create(input: DraftOrderInput): Promise<Order> {
    const quote = await this.calculate(input)
    const order = await this.orderRepository.createDraft(quote.data, quote.lines)
    const created = await this.orderRepository.findDetailOrFail(order.id)
    await this.auditLogService.recordOrderEvent(
      created,
      'created',
      createdChanges(created, created.lineItems)
    )
    return created
  }

  /**
   * Re-prices the draft from current variant prices, rates and discounts.
   * Callers authorize first (OrderPolicy.update rejects completed orders).
   */
  async update(order: Order, input: DraftOrderInput): Promise<Order> {
    const quote = await this.calculate(input)
    const previous = await this.orderRepository.findDetailOrFail(order.id)
    const before = orderAuditSnapshot(previous, previous.lineItems)
    await this.orderRepository.updateDraft(order, quote.data, quote.lines)
    const updated = await this.orderRepository.findDetailOrFail(order.id)
    const changes = orderAuditDiff(before, orderAuditSnapshot(updated, updated.lineItems))
    if (changes) await this.auditLogService.recordOrderEvent(updated, 'updated', changes)
    return updated
  }

  async delete(order: Order): Promise<void> {
    await this.orderRepository.deleteDraft(order)
  }

  /**
   * Completes the draft at its saved prices. Stock is committed at the
   * default location.
   */
  async complete(order: Order, paymentStatus: OrderPaymentStatus): Promise<Order> {
    const location = await this.locationService.findDefault()
    await this.orderRepository.complete(order, {
      paymentStatus,
      locationId: location?.id ?? null,
    })
    const placed = await this.orderRepository.findDetailOrFail(order.id)
    await this.auditLogService.recordOrderEvent(placed, 'placed', placedChanges(placed))
    // Staff completed it themselves, so only the customer is told.
    await this.orderNotificationService.orderPlaced(placed.id, { notifyStaff: false })
    return placed
  }

  protected async findCustomer(id: string): Promise<Customer | null> {
    const customer = await orNullIfMissing(this.customerRepository.findOrFail(id))
    return customer?.isActive ? customer : null
  }

  protected async findAddress(customerId: string, id: string): Promise<CustomerAddress | null> {
    return orNullIfMissing(this.customerAddressRepository.findForCustomerOrFail(customerId, id))
  }

  /**
   * The chosen market, else the market covering the shipping country, else
   * the primary market, with its countries preloaded (tax follows the
   * market's country, not the delivery address).
   */
  protected async resolveMarket(
    marketId: string | null,
    countryCode: string | null
  ): Promise<Market | null> {
    if (marketId) return this.marketService.findActiveWithCountries(marketId)
    const market = countryCode
      ? await this.marketService.findForCountry(countryCode)
      : await this.marketService.findPrimary()
    return market ? this.marketService.findActiveWithCountries(market.id) : null
  }
}
