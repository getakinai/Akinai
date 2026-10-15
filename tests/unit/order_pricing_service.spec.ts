import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import OrderPricingService, { roundMoney } from '#services/order_pricing_service'

const lines = [
  { unitPrice: 19.99, quantity: 3 },
  { unitPrice: 5, quantity: 1 },
]

test.group('OrderPricingService', () => {
  test('totals lines with no discount, shipping or tax', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines,
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: null,
    })

    assert.deepEqual(result, {
      lineTotals: [59.97, 5],
      subtotal: 64.97,
      discountTotal: 0,
      shippingDiscountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      total: 64.97,
    })
  })

  test('adds exclusive tax on the discounted subtotal and shipping', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 50, quantity: 2 }],
      pricesIncludeTax: false,
      lineDiscounts: [10],
      shippingDiscount: 0,
      shippingPrice: 10,
      tax: { rate: 15, appliesToShipping: true },
    })

    assert.equal(result.discountTotal, 10)
    assert.equal(result.taxTotal, 15)
    assert.equal(result.total, 115)
  })

  test('leaves shipping untaxed when the rate does not apply to it', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 100, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: 20,
      tax: { rate: 10, appliesToShipping: false },
    })

    assert.equal(result.taxTotal, 10)
    assert.equal(result.total, 130)
  })

  test('extracts inclusive tax without raising the total', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 115, quantity: 1 }],
      pricesIncludeTax: true,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 15, appliesToShipping: true },
    })

    assert.equal(result.taxTotal, 15)
    assert.equal(result.total, 115)
  })

  test('caps a line discount at the line total', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 30, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: [50],
      shippingDiscount: 0,
      shippingPrice: 5,
      tax: null,
    })

    assert.equal(result.discountTotal, 30)
    assert.equal(result.total, 5)
  })

  test('ignores a zero tax rate', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 10, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 0, appliesToShipping: true },
    })

    assert.equal(result.taxTotal, 0)
    assert.equal(result.total, 10)
  })

  test('leaves untaxed lines out of the taxable amount', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [
        { unitPrice: 100, quantity: 1, taxable: true },
        { unitPrice: 50, quantity: 1, taxable: false },
      ],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 10, appliesToShipping: true },
    })

    assert.equal(result.subtotal, 150)
    assert.equal(result.taxTotal, 10)
    assert.equal(result.total, 160)
  })

  test('treats lines without a taxable flag as taxable', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 100, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 10, appliesToShipping: false },
    })

    assert.equal(result.taxTotal, 10)
  })

  test('splits the discount across taxed and untaxed lines', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [
        { unitPrice: 75, quantity: 1, taxable: true },
        { unitPrice: 25, quantity: 1, taxable: false },
      ],
      pricesIncludeTax: false,
      lineDiscounts: [15, 5],
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 10, appliesToShipping: false },
    })

    assert.equal(result.discountTotal, 20)
    assert.equal(result.taxTotal, 6)
    assert.equal(result.total, 86)
  })

  test('still taxes shipping when every line is untaxed', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 40, quantity: 2, taxable: false }],
      pricesIncludeTax: false,
      lineDiscounts: [40],
      shippingDiscount: 0,
      shippingPrice: 10,
      tax: { rate: 10, appliesToShipping: true },
    })

    assert.equal(result.taxTotal, 1)
    assert.equal(result.total, 51)
  })

  test('extracts inclusive tax only from taxed lines', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [
        { unitPrice: 115, quantity: 1, taxable: true },
        { unitPrice: 50, quantity: 1, taxable: false },
      ],
      pricesIncludeTax: true,
      lineDiscounts: null,
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 15, appliesToShipping: false },
    })

    assert.equal(result.taxTotal, 15)
    assert.equal(result.total, 165)
  })

  test('takes the shipping discount off shipping and its tax', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 50, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 10,
      shippingPrice: 10,
      tax: { rate: 10, appliesToShipping: true },
    })

    assert.equal(result.shippingDiscountTotal, 10)
    assert.equal(result.shippingTotal, 0)
    assert.equal(result.taxTotal, 5)
    assert.equal(result.total, 55)
  })

  test('caps the shipping discount at the shipping price', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [{ unitPrice: 50, quantity: 1 }],
      pricesIncludeTax: false,
      lineDiscounts: null,
      shippingDiscount: 25,
      shippingPrice: 10,
      tax: null,
    })

    assert.equal(result.shippingDiscountTotal, 10)
    assert.equal(result.shippingTotal, 0)
    assert.equal(result.total, 50)
  })

  test('taxes each line after its own discount', async ({ assert }) => {
    const pricing = await app.container.make(OrderPricingService)

    const result = pricing.price({
      lines: [
        { unitPrice: 100, quantity: 1, taxable: true },
        { unitPrice: 100, quantity: 1, taxable: false },
      ],
      pricesIncludeTax: false,
      lineDiscounts: [0, 50],
      shippingDiscount: 0,
      shippingPrice: null,
      tax: { rate: 10, appliesToShipping: false },
    })

    assert.equal(result.discountTotal, 50)
    assert.equal(result.taxTotal, 10)
    assert.equal(result.total, 160)
  })

  test('roundMoney rounds half cents up', ({ assert }) => {
    assert.equal(roundMoney(1.005), 1.01)
    assert.equal(roundMoney(2.344), 2.34)
  })
})
