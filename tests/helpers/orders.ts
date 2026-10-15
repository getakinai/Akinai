import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import InventoryLevel from '#models/inventory_level'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import DiscountService, { type DiscountInput } from '#services/discount_service'
import LocationService from '#services/location_service'
import MarketService from '#services/market_service'
import PaymentMethodService, { type BankTransferInput } from '#services/payment_method_service'
import ProductService from '#services/product_service'
import ShippingService from '#services/shipping_service'
import TaxService from '#services/tax_service'

let sequence = 0

/**
 * Everything a draft order needs: an AUD primary market for AU (prices
 * exclude tax), 10% GST that applies to shipping, a $10 standard rate, a
 * default location and a customer with a default AU address.
 */
export async function seedOrderSetup() {
  const marketService = await app.container.make(MarketService)
  const locationService = await app.container.make(LocationService)
  const taxService = await app.container.make(TaxService)
  const shippingService = await app.container.make(ShippingService)

  const market = await marketService.ensurePrimary({
    name: 'Australia',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    countryCodes: ['AU'],
  })
  const location = await locationService.ensureDefault('Main warehouse')
  const taxRate = await taxService.ensureRate({
    name: 'GST',
    countryCode: 'AU',
    regionCode: null,
    rate: 10,
    appliesToShipping: true,
  })
  const zone = await shippingService.ensureZone({ name: 'Australia', countryCodes: ['AU'] }, [
    { name: 'Standard', price: 10, minSubtotal: null, maxSubtotal: null, isActive: true },
  ])
  const customer = await createOrderCustomer()

  return { market, location, taxRate, rate: zone.rates[0], ...customer }
}

/**
 * Offers bank transfer in the market, so checkout can place orders there.
 * The account details default to placeholder AU values; pass overrides
 * when a test checks them.
 */
export async function enableBankTransfer(
  marketId: string,
  overrides: Partial<BankTransferInput> = {}
) {
  const paymentMethodService = await app.container.make(PaymentMethodService)
  await paymentMethodService.updateBankTransfer(marketId, {
    isEnabled: true,
    countryCode: 'AU',
    accountName: 'Test Store',
    bankName: 'Test Bank',
    accountNumber: '123456',
    bsb: '062-000',
    ...overrides,
  })
}

export async function createOrderCustomer(countryCode = 'AU') {
  const customerService = await app.container.make(CustomerService)
  const addressService = await app.container.make(CustomerAddressService)
  sequence++

  const customer = await customerService.create({
    fullName: `Jane Buyer ${sequence}`,
    email: `jane-${sequence}-${Date.now()}@example.com`,
    phone: null,
  })
  const address = await addressService.create(customer, {
    fullName: 'Jane Buyer',
    company: null,
    address1: '1 George Street',
    address2: null,
    city: 'Sydney',
    province: 'NSW',
    postalCode: '2000',
    countryCode,
    phone: null,
    isDefault: true,
  })
  return { customer, address }
}

/**
 * An active single-variant product. Pass `stock` to track inventory at the
 * default location with that many available.
 */
export async function createOrderProduct(
  title: string,
  price: number,
  {
    stock,
    status = 'active',
    chargeTax = true,
    freeShipping = false,
    weight = null,
  }: {
    stock?: number
    status?: 'active' | 'draft'
    chargeTax?: boolean
    freeShipping?: boolean
    weight?: number | null
  } = {}
) {
  const productService = await app.container.make(ProductService)
  const locationService = await app.container.make(LocationService)
  const product = await productService.create({
    title,
    description: null,
    status,
    chargeTax,
    freeShipping,
    weight,
    price,
    options: [],
  })
  const { product: detail } = await productService.findDetail(product.id)
  const variant = detail.variants[0]

  if (stock !== undefined) {
    const location = await locationService.ensureDefault('Main warehouse')
    await variant.merge({ trackInventory: true, sku: title.toUpperCase() }).save()
    await InventoryLevel.create({
      productVariantId: variant.id,
      locationId: location.id,
      available: stock,
    })
  }

  return { product, variant }
}

export async function createOrderDiscount(overrides: Partial<DiscountInput> = {}) {
  const discountService = await app.container.make(DiscountService)
  return discountService.create({
    title: 'Ten off',
    code: 'SAVE10',
    method: 'code',
    valueType: 'percentage',
    value: 10,
    minSubtotal: null,
    usageLimit: null,
    oncePerCustomer: false,
    startsAt: DateTime.now().minus({ days: 1 }),
    endsAt: null,
    ...overrides,
  })
}
