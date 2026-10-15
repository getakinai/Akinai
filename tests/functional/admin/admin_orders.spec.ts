import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Permission } from '#abilities/permissions'
import InventoryLevel from '#models/inventory_level'
import Order from '#models/order'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import {
  createOrderCustomer,
  createOrderDiscount,
  createOrderProduct,
  seedOrderSetup,
} from '#tests/helpers/orders'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

type Body = Record<string, unknown>

function post(client: any, user: User, url: string, body: Body) {
  return client.post(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)
}

function put(client: any, user: User, url: string, body: Body) {
  return client.put(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)
}

function get(client: any, user: User, url: string, qs: Body = {}) {
  return client.get(url).qs(qs).accept('json').withGuard('web').loginAs(user)
}

async function staff(permissions: Permission[] | 'admin' = 'admin') {
  return createAdminUser(permissions)
}

test.group('Staff draft orders: calculate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('prices lines, discount, shipping and tax for the address', async ({ client, assert }) => {
    const user = await staff(['orders.create'])
    const { customer, address, rate, market } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    await createOrderDiscount()

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 2 }],
      customerId: customer.id,
      shippingAddressId: address.id,
      discountCode: 'save10',
      shippingRateId: rate.id,
    })

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.market.id, market.id)
    assert.equal(data.market.currencyCode, 'AUD')
    assert.isTrue(data.taxCalculated)
    assert.deepEqual(data.tax, { name: 'GST', rate: 10, appliesToShipping: true })
    assert.deepEqual(
      data.shippingRates.map(({ name }: { name: string }) => name),
      ['Standard']
    )
    assert.equal(data.discount.code, 'SAVE10')
    assert.equal(data.lineItems[0].lineTotal, 40)
    assert.equal(data.subtotal, 40)
    assert.equal(data.discountTotal, 4)
    assert.equal(data.shippingTotal, 10)
    assert.equal(data.taxTotal, 4.6)
    assert.equal(data.total, 50.6)
  })

  test('prices a free shipping code in its own slot', async ({ client, assert }) => {
    const user = await staff(['orders.create'])
    const { customer, address, rate } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    await createOrderDiscount({ title: 'Ships free', code: 'FREESHIP', type: 'free_shipping' })

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      shippingAddressId: address.id,
      discountCode: 'freeship',
      shippingRateId: rate.id,
    })

    response.assertStatus(200)
    const { data } = response.body()
    assert.isNull(data.discount)
    assert.equal(data.shippingDiscount.code, 'FREESHIP')
    assert.equal(data.shippingDiscount.title, 'Ships free')
    assert.equal(data.discountTotal, 0)
    assert.equal(data.shippingDiscountTotal, 10)
    assert.equal(data.shippingTotal, 0)
    assert.equal(data.taxTotal, 2)
    assert.equal(data.total, 22)
  })

  test('ignores automatic discounts on drafts', async ({ client, assert }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    await createOrderDiscount({ method: 'automatic' })

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })

    response.assertStatus(200)
    assert.isNull(response.body().data.discount)
    assert.equal(response.body().data.discountTotal, 0)
  })

  test('taxes by the market and leaves shipping out until there is an address', async ({
    client,
    assert,
  }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })

    response.assertStatus(200)
    const { data } = response.body()
    assert.isTrue(data.taxCalculated)
    assert.deepEqual(data.tax, { name: 'GST', rate: 10, appliesToShipping: true })
    assert.deepEqual(data.shippingRates, [])
    assert.equal(data.market.name, 'Australia')
    assert.equal(data.shippingTotal, 0)
    assert.equal(data.taxTotal, 2)
    assert.equal(data.total, 22)
  })

  test('accepts an empty order so the form can show the market', async ({ client, assert }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [],
    })

    response.assertStatus(200)
    assert.equal(response.body().data.total, 0)
  })

  test('reports an unknown discount code on its field', async ({ client }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      discountCode: 'NOPE',
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'discountCode', message: 'This code isn’t valid for this order' }],
    })
  })

  test('refuses shipping without an address', async ({ client }) => {
    const user = await staff(['orders.create'])
    const { rate } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      shippingRateId: rate.id,
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'shippingRateId', message: 'Add a shipping address before choosing shipping' },
      ],
    })
  })

  test('refuses another customer’s address', async ({ client }) => {
    const user = await staff(['orders.create'])
    const { customer } = await seedOrderSetup()
    const { address: otherAddress } = await createOrderCustomer()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
      shippingAddressId: otherAddress.id,
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'shippingAddressId' }] })
  })

  test('refuses products that are not active', async ({ client }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Hidden mug', 20, { status: 'draft' })

    const response = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'lineItems.0.variantId', message: 'This product is no longer available' }],
    })
  })

  test('validates quantities and repeated variants', async ({ client }) => {
    const user = await staff(['orders.create'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const zero = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [{ variantId: variant.id, quantity: 0 }],
    })
    zero.assertStatus(422)
    zero.assertBodyContains({ errors: [{ field: 'lineItems.0.quantity' }] })

    const repeated = await post(client, user, '/admin/orders/drafts/calculate', {
      lineItems: [
        { variantId: variant.id, quantity: 1 },
        { variantId: variant.id, quantity: 2 },
      ],
    })
    repeated.assertStatus(422)
  })
})

test.group('Staff draft orders: store, update and delete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves a draft with snapshots of the lines and address', async ({ client, assert }) => {
    const user = await staff(['orders.view', 'orders.create'])
    const { customer, address, rate } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 3 }],
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
    })

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.draftNumber, 1)
    assert.isNull(data.orderNumber)
    assert.equal(data.status, 'draft')
    assert.equal(data.email, customer.email)
    assert.equal(data.currencyCode, 'AUD')
    assert.equal(data.shippingTitle, 'Standard')
    assert.equal(data.shippingAddress.city, 'Sydney')
    assert.equal(data.subtotal, 60)
    assert.equal(data.taxTotal, 7)
    assert.equal(data.total, 77)
    assert.deepEqual(
      data.lineItems.map((line: { productTitle: string; quantity: number }) => [
        line.productTitle,
        line.quantity,
      ]),
      [['Mug', 3]]
    )

    const second = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })
    assert.equal(second.body().data.draftNumber, 2)
  })

  test('update replaces the line items and recalculates', async ({ client, assert }) => {
    const user = await staff(['orders.view', 'orders.create', 'orders.edit'])
    await seedOrderSetup()
    const { variant: mug } = await createOrderProduct('Mug', 20)
    const { variant: cup } = await createOrderProduct('Cup', 5)
    const created = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: mug.id, quantity: 1 }],
    })

    const response = await put(client, user, `/admin/orders/drafts/${created.body().data.id}`, {
      lineItems: [{ variantId: cup.id, quantity: 4 }],
    })

    response.assertStatus(200)
    const { data } = response.body()
    assert.deepEqual(
      data.lineItems.map((line: { productTitle: string }) => line.productTitle),
      ['Cup']
    )
    assert.equal(data.subtotal, 20)
  })

  test('deletes a draft', async ({ client, assert }) => {
    const user = await staff(['orders.view', 'orders.create', 'orders.archive'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const created = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })
    const id = created.body().data.id

    const response = await client
      .delete(`/admin/orders/drafts/${id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    assert.isNull(await Order.find(id))
  })

  test('requires orders.create to save a draft', async ({ client }) => {
    const user = await staff(['orders.view'])
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })

    response.assertStatus(403)
  })

  test('returns 404 for an unknown draft', async ({ client }) => {
    const user = await staff()

    const response = await get(client, user, `/admin/orders/drafts/view/${UNKNOWN_ID}`)

    response.assertStatus(404)
  })
})

test.group('Staff draft orders: complete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createDraft(client: any, user: User, lineItems: Body[], extra: Body = {}) {
    const response = await post(client, user, '/admin/orders/drafts', { lineItems, ...extra })
    response.assertStatus(201)
    return response.body().data as { id: string }
  }

  test('marks a draft as paid, numbers it and commits stock', async ({ client, assert }) => {
    const user = await staff()
    const { customer, location } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20, { stock: 5 })
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 2 }], {
      customerId: customer.id,
    })

    const response = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: { status: 'open', paymentStatus: 'paid', orderNumber: 1001 },
    })
    assert.isNotNull(response.body().data.completedAt)

    const level = await InventoryLevel.query()
      .where('product_variant_id', variant.id)
      .where('location_id', location.id)
      .firstOrFail()
    assert.equal(level.available, 3)
    assert.equal(level.committed, 2)

    const next = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }])
    const pending = await post(client, user, `/admin/orders/drafts/${next.id}/complete`, {
      paymentStatus: 'pending',
    })
    pending.assertBodyContains({ data: { orderNumber: 1002, paymentStatus: 'pending' } })
  })

  test('refuses to complete without enough stock', async ({ client, assert }) => {
    const user = await staff()
    const { location } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20, { stock: 1 })
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 2 }])

    const response = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'lineItems', message: 'Only 1 in stock for Mug (Default Title)' }],
    })
    const order = await Order.findOrFail(draft.id)
    assert.equal(order.status, 'draft')
    const level = await InventoryLevel.query()
      .where('product_variant_id', variant.id)
      .where('location_id', location.id)
      .firstOrFail()
    assert.equal(level.available, 1)
  })

  test('does not track stock for untracked products', async ({ client }) => {
    const user = await staff()
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Gift card', 50)
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 3 }])

    const response = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })

    response.assertStatus(200)
  })

  test('keeps a free shipping code on the completed order', async ({ client, assert }) => {
    const user = await staff()
    const { customer, address, rate } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const discount = await createOrderDiscount({
      title: 'Ships free',
      code: 'FREESHIP',
      type: 'free_shipping',
    })
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }], {
      customerId: customer.id,
      shippingAddressId: address.id,
      shippingRateId: rate.id,
      discountCode: 'FREESHIP',
    })

    const completed = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })
    completed.assertStatus(200)
    const view = await get(client, user, `/admin/orders/view/${draft.id}`)

    view.assertStatus(200)
    view.assertBodyContains({
      data: {
        discountId: null,
        shippingDiscountId: discount.id,
        shippingDiscountCode: 'FREESHIP',
        shippingDiscountTitle: 'Ships free',
        shippingDiscountTotal: 10,
        shippingTotal: 0,
        total: 22,
      },
    })
    await discount.refresh()
    assert.equal(discount.usageCount, 1)
  })

  test('counts discount usage and stops at the limit', async ({ client, assert }) => {
    const user = await staff()
    await seedOrderSetup()
    const discount = await createOrderDiscount({ usageLimit: 1 })
    const { variant } = await createOrderProduct('Mug', 20)
    const first = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }], {
      discountCode: 'SAVE10',
    })
    const second = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }], {
      discountCode: 'SAVE10',
    })

    const ok = await post(client, user, `/admin/orders/drafts/${first.id}/complete`, {
      paymentStatus: 'paid',
    })
    ok.assertStatus(200)
    await discount.refresh()
    assert.equal(discount.usageCount, 1)

    const blocked = await post(client, user, `/admin/orders/drafts/${second.id}/complete`, {
      paymentStatus: 'paid',
    })
    blocked.assertStatus(422)
    blocked.assertBodyContains({ errors: [{ field: 'discountCode' }] })
    await discount.refresh()
    assert.equal(discount.usageCount, 1)
  })

  test('refuses to edit, complete or delete a completed order', async ({ client }) => {
    const user = await staff()
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }])
    await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })

    const again = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })
    again.assertStatus(422)
    again.assertBodyContains({ errors: [{ message: 'This order is already completed' }] })

    const update = await put(client, user, `/admin/orders/drafts/${draft.id}`, {
      lineItems: [{ variantId: variant.id, quantity: 2 }],
    })
    update.assertStatus(422)

    const remove = await client
      .delete(`/admin/orders/drafts/${draft.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    remove.assertStatus(422)
    remove.assertBodyContains({ errors: [{ message: 'Completed orders cannot be deleted' }] })
  })

  test('validates the payment status', async ({ client }) => {
    const user = await staff()
    await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const draft = await createDraft(client, user, [{ variantId: variant.id, quantity: 1 }])

    const response = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'refunded',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'paymentStatus' }] })
  })

  test('refuses an empty draft', async ({ client }) => {
    const user = await staff()
    await seedOrderSetup()
    const draft = await createDraft(client, user, [])

    const response = await post(client, user, `/admin/orders/drafts/${draft.id}/complete`, {
      paymentStatus: 'paid',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'lineItems' }] })
  })
})

test.group('Staff orders: lists and search', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('keeps drafts and completed orders in separate lists', async ({ client, assert }) => {
    const user = await staff()
    const { customer } = await seedOrderSetup()
    const { variant } = await createOrderProduct('Mug', 20)
    const kept = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
    })
    const done = await post(client, user, '/admin/orders/drafts', {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      customerId: customer.id,
    })
    await post(client, user, `/admin/orders/drafts/${done.body().data.id}/complete`, {
      paymentStatus: 'pending',
    })

    const drafts = await get(client, user, '/admin/orders/drafts/list')
    drafts.assertStatus(200)
    assert.deepEqual(
      drafts.body().data.map((row: { id: string }) => row.id),
      [kept.body().data.id]
    )

    const orders = await get(client, user, '/admin/orders/list', { customerId: customer.id })
    orders.assertStatus(200)
    assert.deepEqual(
      orders.body().data.map((row: { orderNumber: number }) => row.orderNumber),
      [1001]
    )
    assert.equal(orders.body().data[0].customer.id, customer.id)

    const paid = await get(client, user, '/admin/orders/list', { paymentStatus: 'paid' })
    assert.lengthOf(paid.body().data, 0)

    const byNumber = await get(client, user, '/admin/orders/list', { q: '#1001' })
    assert.lengthOf(byNumber.body().data, 1)
  })

  test('searches active variants with their stock', async ({ client, assert }) => {
    const user = await staff(['orders.view'])
    await seedOrderSetup()
    await createOrderProduct('Blue mug', 20, { stock: 4 })
    await createOrderProduct('Gift card', 50)
    await createOrderProduct('Secret mug', 20, { status: 'draft' })

    const response = await get(client, user, '/admin/orders/variants/search', { q: 'mug' })

    response.assertStatus(200)
    const rows = response.body().data as { productTitle: string; available: number | null }[]
    assert.deepEqual(
      rows.map(({ productTitle, available }) => [productTitle, available]),
      [['Blue mug', 4]]
    )

    const all = await get(client, user, '/admin/orders/variants/search')
    assert.deepEqual(
      all
        .body()
        .data.map((row: { productTitle: string; available: number | null }) => [
          row.productTitle,
          row.available,
        ]),
      [
        ['Blue mug', 4],
        ['Gift card', null],
      ]
    )
  })

  test('requires the orders.view permission', async ({ client }) => {
    const user = await staff(['products.view'])

    const response = await get(client, user, '/admin/orders/list')

    response.assertStatus(403)
  })
})
