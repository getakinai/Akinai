import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import MarketService from '#services/market_service'
import DraftOrderService from '#services/draft_order_service'
import OrderService from '#services/order_service'
import PriceService from '#services/price_service'
import ShippingService from '#services/shipping_service'
import {
  createOrderCustomer,
  createOrderDiscount,
  createOrderProduct,
  seedOrderSetup,
} from '#tests/helpers/orders'

async function fieldsOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return (error.messages as { field: string }[]).map(({ field }) => field)
    }
    throw error
  }
  return []
}

test.group('DraftOrderService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('uses the market that covers the address country', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const marketService = await app.container.make(MarketService)
    await seedOrderSetup()
    const nz = await marketService.create({
      name: 'New Zealand',
      currencyCode: 'nzd',
      pricesIncludeTax: true,
      countryCodes: ['NZ'],
    })
    const { customer, address } = await createOrderCustomer('NZ')
    const { variant } = await createOrderProduct('Mug', 20)
    const priceService = await app.container.make(PriceService)
    await priceService.syncVariantMarketPrices(
      [variant.id],
      [{ marketId: nz.id, price: 30, compareAtPrice: null }]
    )

    const quote = await service.calculate({
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      shippingAddressId: address.id,
    })

    assert.equal(quote.market.id, nz.id)
    assert.equal(quote.data.currencyCode, 'NZD')
    assert.isTrue(quote.data.pricesIncludeTax)
    assert.isTrue(quote.taxCalculated)
    assert.isNull(quote.taxRate)
    assert.deepEqual(quote.shippingRates, [])
    assert.equal(quote.data.subtotal, 30)
  })

  test('falls back to the primary market for uncovered countries', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { market } = await seedOrderSetup()
    const { customer, address } = await createOrderCustomer('JP')

    const quote = await service.calculate({
      lineItems: [],
      customerId: customer.id,
      shippingAddressId: address.id,
    })

    assert.equal(quote.market.id, market.id)
  })

  test('collects every field error at once', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const fields = await fieldsOf(
      service.calculate({
        lineItems: [
          { variantId: variant.id, quantity: 1 },
          { variantId: '01a11382-716f-7774-83b7-09aa5f030a10', quantity: 1 },
        ],
        customerId: '01a11382-716f-7774-83b7-09aa5f030a11',
        discountCode: 'MISSING',
      })
    )

    assert.sameMembers(fields, ['lineItems.1.variantId', 'customerId', 'discountCode'])
  })

  test('refuses a once-per-customer discount the customer already used', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer } = await seedOrderSetup()
    await createOrderDiscount({ oncePerCustomer: true })
    const { variant } = await createOrderProduct('Mug', 20)
    const input = {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      discountCode: 'SAVE10',
    }

    const first = await service.create(input)
    await service.complete(first, 'paid')

    assert.deepEqual(await fieldsOf(service.calculate(input)), ['discountCode'])
  })

  test('requires a market', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)

    assert.deepEqual(await fieldsOf(service.calculate({ lineItems: [] })), ['marketId'])
  })

  test('only taxes lines of products that charge tax', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address } = await seedOrderSetup()
    const { variant: shirt } = await createOrderProduct('Shirt', 100)
    const { variant: giftCard } = await createOrderProduct('Gift card', 50, { chargeTax: false })

    const draft = await service.create({
      lineItems: [
        { variantId: shirt.id, quantity: 1 },
        { variantId: giftCard.id, quantity: 1 },
      ],
      customerId: customer.id,
      shippingAddressId: address.id,
    })

    assert.equal(draft.subtotal, 150)
    assert.equal(draft.taxTotal, 10)
    assert.equal(draft.total, 160)
    assert.deepEqual(
      draft.lineItems.map(({ productTitle, taxable }) => [productTitle, taxable]),
      [
        ['Shirt', true],
        ['Gift card', false],
      ]
    )
  })

  test('placed order edits keep the taxable snapshot of kept lines', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const orderService = await app.container.make(OrderService)
    const { customer, address } = await seedOrderSetup()
    const { variant: shirt } = await createOrderProduct('Shirt', 100)
    const { product: giftCardProduct, variant: giftCard } = await createOrderProduct(
      'Gift card',
      20,
      { chargeTax: false }
    )
    const draft = await service.create({
      lineItems: [
        { variantId: shirt.id, quantity: 1 },
        { variantId: giftCard.id, quantity: 1 },
      ],
      customerId: customer.id,
      shippingAddressId: address.id,
    })
    const placed = await service.complete(draft, 'pending')
    await giftCardProduct.merge({ chargeTax: true }).save()

    const updated = await orderService.updatePlaced(placed, {
      paymentStatus: 'pending',
      lineItems: placed.lineItems.map((line) => ({
        lineItemId: line.id,
        quantity: line.productTitle === 'Gift card' ? 2 : line.quantity,
      })),
      totalOverride: null,
    })

    assert.equal(updated.subtotal, 140)
    assert.equal(updated.taxTotal, 10)
    const giftCardLine = updated.lineItems.find(({ productTitle }) => productTitle === 'Gift card')
    assert.isFalse(giftCardLine?.taxable)
  })

  test('offers rates by cart weight and item count', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const shippingService = await app.container.make(ShippingService)
    const { customer, address, rate } = await seedOrderSetup()
    const zone = await shippingService.findOrFail(rate.shippingZoneId)
    await shippingService.createRate(zone, {
      name: 'Free under 2 kg',
      price: 0,
      minSubtotal: null,
      maxSubtotal: null,
      maxWeight: 2,
      isActive: true,
    })
    await shippingService.createRate(zone, {
      name: 'Bulk',
      price: 5,
      minSubtotal: null,
      maxSubtotal: null,
      minItems: 5,
      isActive: true,
    })
    const { variant } = await createOrderProduct('Mug', 20, { weight: 0.5 })

    const rateNames = async (quantity: number) => {
      const quote = await service.calculate({
        lineItems: [{ variantId: variant.id, quantity }],
        customerId: customer.id,
        shippingAddressId: address.id,
      })
      return quote.shippingRates.map(({ name }) => name)
    }

    assert.sameMembers(await rateNames(4), ['Free under 2 kg', 'Standard'])
    assert.sameMembers(await rateNames(5), ['Bulk', 'Standard'])
  })

  test('counts variants without a weight as 0', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const shippingService = await app.container.make(ShippingService)
    const { customer, address, rate } = await seedOrderSetup()
    const zone = await shippingService.findOrFail(rate.shippingZoneId)
    await shippingService.createRate(zone, {
      name: 'Heavy',
      price: 30,
      minSubtotal: null,
      maxSubtotal: null,
      minWeight: 1,
      isActive: true,
    })
    const { variant } = await createOrderProduct('Sticker', 2)

    const quote = await service.calculate({
      lineItems: [{ variantId: variant.id, quantity: 50 }],
      customerId: customer.id,
      shippingAddressId: address.id,
    })

    assert.deepEqual(
      quote.shippingRates.map(({ name }) => name),
      ['Standard']
    )
  })

  test('ships free when every item ships free', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address, rate } = await seedOrderSetup()
    const { variant: book } = await createOrderProduct('Book', 30, { freeShipping: true })
    const { variant: card } = await createOrderProduct('Card', 5, { freeShipping: true })

    const draft = await service.create({
      lineItems: [
        { variantId: book.id, quantity: 1 },
        { variantId: card.id, quantity: 2 },
      ],
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
    })

    assert.equal(draft.shippingPrice, 0)
    assert.equal(draft.shippingTotal, 0)
  })

  test('charges shipping when only some items ship free', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address, rate } = await seedOrderSetup()
    const { variant: book } = await createOrderProduct('Book', 30, { freeShipping: true })
    const { variant: mug } = await createOrderProduct('Mug', 20)

    const draft = await service.create({
      lineItems: [
        { variantId: book.id, quantity: 1 },
        { variantId: mug.id, quantity: 1 },
      ],
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
    })

    assert.equal(draft.shippingPrice, 10)
  })

  test('rejects a rate the cart does not qualify for', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const shippingService = await app.container.make(ShippingService)
    const { customer, address, rate } = await seedOrderSetup()
    const zone = await shippingService.findOrFail(rate.shippingZoneId)
    const free = await shippingService.createRate(zone, {
      name: 'Free for 3+ items',
      price: 0,
      minSubtotal: null,
      maxSubtotal: null,
      minItems: 3,
      isActive: true,
    })
    const { variant } = await createOrderProduct('Mug', 20)

    const fields = await fieldsOf(
      service.calculate({
        lineItems: [{ variantId: variant.id, quantity: 2 }],
        customerId: customer.id,
        shippingAddressId: address.id,
        shippingRateId: free.id,
      })
    )

    assert.deepEqual(fields, ['shippingRateId'])
  })

  test('discounts only the chosen products and taxes each line net', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address } = await seedOrderSetup()
    const { product: shirt, variant: shirtVariant } = await createOrderProduct('Shirt', 100)
    const { variant: mug } = await createOrderProduct('Mug', 50)
    await createOrderDiscount({
      type: 'amount_off_products',
      value: 20,
      appliesTo: 'products',
      productIds: [shirt.id],
    })

    const quote = await service.calculate({
      lineItems: [
        { variantId: shirtVariant.id, quantity: 1 },
        { variantId: mug.id, quantity: 1 },
      ],
      customerId: customer.id,
      shippingAddressId: address.id,
      discountCode: 'SAVE10',
    })

    assert.deepEqual(
      quote.lines.map(({ discountAllocation }) => discountAllocation),
      [20, 0]
    )
    assert.equal(quote.data.discountTotal, 20)
    assert.equal(quote.data.taxTotal, 13)
    assert.equal(quote.data.total, 143)
  })

  test('a free shipping code takes the rate off and untaxes it', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address, rate } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    await createOrderDiscount({ title: 'Ships free', code: 'FREESHIP', type: 'free_shipping' })

    const quote = await service.calculate({
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
      discountCode: 'freeship',
    })

    assert.isNull(quote.discount)
    assert.equal(quote.shippingDiscount?.code, 'FREESHIP')
    assert.equal(quote.data.shippingDiscountCode, 'FREESHIP')
    assert.equal(quote.data.shippingDiscountTitle, 'Ships free')
    assert.equal(quote.data.shippingDiscountTotal, 10)
    assert.equal(quote.data.shippingTotal, 0)
    assert.equal(quote.data.discountTotal, 0)
    assert.equal(quote.data.taxTotal, 2)
    assert.equal(quote.data.total, 22)
  })

  test('drafts never apply automatic discounts', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    await createOrderDiscount({ method: 'automatic' })

    const quote = await service.calculate({ lineItems: [{ variantId: variant.id, quantity: 1 }] })

    assert.isNull(quote.discount)
    assert.equal(quote.data.discountTotal, 0)
  })

  test('refuses a code for products that are not in the cart', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    await seedOrderSetup()
    const { product: shirt } = await createOrderProduct('Shirt', 100)
    const { variant: mug } = await createOrderProduct('Mug', 50)
    await createOrderDiscount({
      type: 'amount_off_products',
      appliesTo: 'products',
      productIds: [shirt.id],
    })

    const fields = await fieldsOf(
      service.calculate({
        lineItems: [{ variantId: mug.id, quantity: 1 }],
        discountCode: 'SAVE10',
      })
    )

    assert.deepEqual(fields, ['discountCode'])
  })

  test('refuses a once-per-customer free shipping code used before', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    const { customer, address, rate } = await seedOrderSetup()
    const discount = await createOrderDiscount({
      code: 'FREESHIP',
      type: 'free_shipping',
      oncePerCustomer: true,
    })
    const { variant } = await createOrderProduct('Mug', 20)
    const input = {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
      discountCode: 'FREESHIP',
    }

    const first = await service.create(input)
    await service.complete(first, 'paid')
    await discount.refresh()

    assert.equal(first.shippingDiscountId, discount.id)
    assert.equal(discount.usageCount, 1)
    assert.deepEqual(await fieldsOf(service.calculate(input)), ['discountCode'])
  })

  test('numbers completed orders from 1001 in completion order', async ({ assert }) => {
    const service = await app.container.make(DraftOrderService)
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const input = { lineItems: [{ variantId: variant.id, quantity: 1 }] }
    const first = await service.create(input)
    const second = await service.create(input)

    const completedSecond = await service.complete(second, 'pending')
    const completedFirst = await service.complete(first, 'paid')

    assert.equal(first.draftNumber, 1)
    assert.equal(second.draftNumber, 2)
    assert.equal(completedSecond.orderNumber, 1001)
    assert.equal(completedFirst.orderNumber, 1002)
  })
})
