import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import {
  createOrderDiscount,
  createOrderProduct,
  enableBankTransfer,
  seedOrderSetup,
} from '#tests/helpers/orders'

type Setup = Awaited<ReturnType<typeof seedOrderSetup>>

let sequence = 0

async function seedCart(price = 50) {
  const setup = await seedOrderSetup()
  await enableBankTransfer(setup.market.id)
  const { product, variant } = await createOrderProduct('Mug', price)
  return { ...setup, product, variant }
}

function quoteBody(
  { rate, variant }: Pick<Setup, 'rate'> & { variant: { id: string } },
  discountCode?: unknown
) {
  return {
    lineItems: [{ variantId: variant.id, quantity: 1 }],
    countryCode: 'AU',
    province: 'NSW',
    postalCode: '2000',
    shippingRateId: rate.id,
    ...(discountCode === undefined ? {} : { discountCode }),
  }
}

function placeBody(cart: Pick<Setup, 'rate'> & { variant: { id: string } }, email?: string) {
  sequence++
  return {
    ...quoteBody(cart, 'SAVE10'),
    email: email ?? `guest-${sequence}-${Date.now()}@example.com`,
    firstName: 'Jane',
    lastName: 'Buyer',
    address1: '1 George Street',
    city: 'Sydney',
    phone: '+61400000000',
    paymentMethod: 'bank_transfer',
  }
}

test.group('Checkout: discount codes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  test('applies a valid code to the quote, case-insensitively', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount()

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, 'save10'))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.discountCode, 'SAVE10')
    assert.equal(data.discountTitle, 'Ten off')
    assert.equal(data.subtotal, 50)
    assert.equal(data.discountTotal, 5)
  })

  test('quotes without a code have no discount', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount()

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(200)
    assert.isNull(response.body().data.discountCode)
    assert.equal(response.body().data.discountTotal, 0)
  })

  test('rejects an unknown code', async ({ client }) => {
    const cart = await seedCart()

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, 'NOPE'))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })

  test('rejects an expired code', async ({ client }) => {
    const cart = await seedCart()
    await createOrderDiscount({ endsAt: DateTime.now().minus({ hours: 1 }) })

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, 'SAVE10'))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })

  test('rejects a code when the cart is below its minimum subtotal', async ({ client }) => {
    const cart = await seedCart(20)
    await createOrderDiscount({ minSubtotal: 30 })

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, 'SAVE10'))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })

  test('rejects a code that is not a string', async ({ client }) => {
    const cart = await seedCart()

    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, 10))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })

  test('placing an order saves the code and counts the use', async ({ client, assert }) => {
    const cart = await seedCart()
    const discount = await createOrderDiscount()
    const body = placeBody(cart)

    const response = await client.post('/checkout').json(body).accept('json').withCsrfToken()

    response.assertStatus(201)
    const order = await Order.query().where('email', body.email).firstOrFail()
    assert.equal(order.discountCode, 'SAVE10')
    assert.equal(order.discountId, discount.id)
    assert.equal(Number(order.discountTotal), 5)
    await discount.refresh()
    assert.equal(discount.usageCount, 1)
  })

  test('a guest can use a once-per-customer code only once', async ({ client }) => {
    const cart = await seedCart()
    await createOrderDiscount({ oncePerCustomer: true })
    const email = `repeat-${Date.now()}@example.com`

    const first = await client
      .post('/checkout')
      .json(placeBody(cart, email))
      .accept('json')
      .withCsrfToken()
    const second = await client
      .post('/checkout')
      .json(placeBody(cart, email))
      .accept('json')
      .withCsrfToken()

    first.assertStatus(201)
    second.assertStatus(422)
    second.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })

  test('a used-up code can no longer be placed', async ({ client }) => {
    const cart = await seedCart()
    await createOrderDiscount({ usageLimit: 1 })

    const first = await client
      .post('/checkout')
      .json(placeBody(cart))
      .accept('json')
      .withCsrfToken()
    const second = await client
      .post('/checkout')
      .json(placeBody(cart))
      .accept('json')
      .withCsrfToken()

    first.assertStatus(201)
    second.assertStatus(422)
    second.assertBodyContains({ errors: [{ field: 'discountCode' }] })
  })
})

test.group('Checkout: discount types', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  async function quote(client: ApiClient, body: Record<string, unknown>) {
    return client.post('/checkout/quote').json(body).accept('json').withCsrfToken()
  }

  test('applies the best automatic discount without a code', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount({ method: 'automatic', title: 'Auto ten' })
    await createOrderDiscount({
      method: 'automatic',
      title: 'Auto two',
      valueType: 'fixed_amount',
      value: 2,
    })

    const response = await quote(client, quoteBody(cart))

    response.assertStatus(200)
    const data = response.body().data
    assert.isNull(data.discountCode)
    assert.equal(data.discountTitle, 'Auto ten')
    assert.equal(data.discountTotal, 5)
    assert.equal(data.lineItems[0].discountAllocation, 5)
  })

  test('a free shipping code takes the shipping off', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount({ title: 'Ships free', code: 'FREESHIP', type: 'free_shipping' })

    const response = await quote(client, quoteBody(cart, 'freeship'))

    response.assertStatus(200)
    const data = response.body().data
    assert.isNull(data.discountCode)
    assert.equal(data.shippingDiscountCode, 'FREESHIP')
    assert.equal(data.shippingDiscountTitle, 'Ships free')
    assert.equal(data.shippingDiscountTotal, 10)
    assert.equal(data.shippingTotal, 0)
    assert.equal(data.discountTotal, 0)
  })

  test('a free shipping code stacks with an automatic discount', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount({ code: 'FREESHIP', type: 'free_shipping' })
    await createOrderDiscount({ method: 'automatic', title: 'Auto ten' })

    const response = await quote(client, quoteBody(cart, 'FREESHIP'))

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.discountTitle, 'Auto ten')
    assert.equal(data.discountTotal, 5)
    assert.equal(data.shippingDiscountCode, 'FREESHIP')
    assert.equal(data.shippingDiscountTotal, 10)
  })

  test('rejects a free shipping code above its maximum rate', async ({ client }) => {
    const cart = await seedCart()
    await createOrderDiscount({ code: 'FREESHIP', type: 'free_shipping', maxShippingPrice: 5 })

    const response = await quote(client, quoteBody(cart, 'FREESHIP'))

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'discountCode', message: 'This code doesn’t cover the chosen shipping rate' },
      ],
    })
  })

  test('rejects a products code for items not in the cart', async ({ client }) => {
    const cart = await seedCart()
    const { product } = await createOrderProduct('Shirt', 80)
    await createOrderDiscount({
      type: 'amount_off_products',
      appliesTo: 'products',
      productIds: [product.id],
    })

    const response = await quote(client, quoteBody(cart, 'SAVE10'))

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'discountCode', message: 'This code doesn’t apply to the items in your cart' },
      ],
    })
  })

  test('applies buy x get y to the cart', async ({ client, assert }) => {
    const cart = await seedCart(20)
    const { product } = cart
    await createOrderDiscount({
      code: 'BOGO',
      type: 'buy_x_get_y',
      valueType: 'percentage',
      value: 100,
      buyRequirement: 'quantity',
      buyValue: 1,
      buyAppliesTo: 'products',
      buyProductIds: [product.id],
      appliesTo: 'products',
      productIds: [product.id],
      getQuantity: 1,
    })

    const response = await quote(client, {
      ...quoteBody(cart, 'BOGO'),
      lineItems: [{ variantId: cart.variant.id, quantity: 2 }],
    })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.subtotal, 40)
    assert.equal(data.discountTotal, 20)
  })

  test('placing an order saves the shipping discount and counts both uses', async ({
    client,
    assert,
  }) => {
    const cart = await seedCart()
    const shipping = await createOrderDiscount({ code: 'FREESHIP', type: 'free_shipping' })
    const automatic = await createOrderDiscount({ method: 'automatic', title: 'Auto ten' })
    const body = { ...placeBody(cart), discountCode: 'FREESHIP' }

    const response = await client.post('/checkout').json(body).accept('json').withCsrfToken()

    response.assertStatus(201)
    const order = await Order.query()
      .where('email', body.email)
      .preload('lineItems')
      .firstOrFail()
    assert.equal(order.discountId, automatic.id)
    assert.isNull(order.discountCode)
    assert.equal(order.discountTitle, 'Auto ten')
    assert.equal(Number(order.discountTotal), 5)
    assert.equal(order.shippingDiscountId, shipping.id)
    assert.equal(order.shippingDiscountCode, 'FREESHIP')
    assert.equal(Number(order.shippingDiscountTotal), 10)
    assert.equal(Number(order.shippingTotal), 0)
    assert.equal(Number(order.lineItems[0].discountAllocation), 5)
    await shipping.refresh()
    await automatic.refresh()
    assert.equal(shipping.usageCount, 1)
    assert.equal(automatic.usageCount, 1)
  })
})

test.group('Checkout: discount code guessing', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(30_000)

  async function quote(
    client: ApiClient,
    cart: Pick<Setup, 'rate'> & { variant: { id: string } },
    code?: string
  ) {
    return client.post('/checkout/quote').json(quoteBody(cart, code)).accept('json').withCsrfToken()
  }

  test('blocks code checks after 10 rejected codes', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount()

    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await quote(client, cart, `WRONG${attempt}`)
      response.assertStatus(422)
    }
    const blocked = await quote(client, cart, 'SAVE10')

    blocked.assertStatus(422)
    const [error] = blocked.body().errors
    assert.equal(error.field, 'discountCode')
    assert.match(error.message, /Too many attempts/)
  })

  test('quotes without a code still work while blocked', async ({ client }) => {
    const cart = await seedCart()

    for (let attempt = 0; attempt < 10; attempt++) {
      await quote(client, cart, `WRONG${attempt}`)
    }
    const response = await quote(client, cart)

    response.assertStatus(200)
  })

  test('a valid code does not reset the count', async ({ client, assert }) => {
    const cart = await seedCart()
    await createOrderDiscount()

    for (let attempt = 0; attempt < 9; attempt++) {
      await quote(client, cart, `WRONG${attempt}`)
    }
    const valid = await quote(client, cart, 'SAVE10')
    const tenth = await quote(client, cart, 'WRONG9')
    const blocked = await quote(client, cart, 'SAVE10')

    valid.assertStatus(200)
    tenth.assertStatus(422)
    blocked.assertStatus(422)
    assert.match(blocked.body().errors[0].message, /Too many attempts/)
  })
})
