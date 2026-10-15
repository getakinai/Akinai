import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import DiscountService, { type DiscountInput } from '#services/discount_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createOrderProduct, seedOrderSetup } from '#tests/helpers/orders'

const payload = {
  title: 'Ten off',
  type: 'amount_off_order',
  method: 'code',
  code: 'save10',
  valueType: 'percentage',
  value: 10,
  minSubtotal: null,
  usageLimit: null,
  oncePerCustomer: false,
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: null,
}

function without(...keys: string[]) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !keys.includes(key)))
}

async function createDiscount(overrides: Partial<DiscountInput> = {}) {
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

test.group('Staff discounts: list and view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('filters discounts by computed status', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const discountService = await app.container.make(DiscountService)
    await createDiscount({ code: 'NOW' })
    await createDiscount({ code: 'LATER', startsAt: DateTime.now().plus({ days: 2 }) })
    await createDiscount({ code: 'PAST', endsAt: DateTime.now().minus({ hours: 1 }) })
    await discountService.archive(await createDiscount({ code: 'GONE' }))

    const codesFor = async (status: string) => {
      const response = await client
        .get('/admin/discounts/list')
        .qs({ status })
        .accept('json')
        .withGuard('web')
        .loginAs(user)
      response.assertStatus(200)
      return response.body().data.map((row: { code: string; status: string }) => {
        assert.equal(row.status, status)
        return row.code
      })
    }

    assert.deepEqual(await codesFor('active'), ['NOW'])
    assert.deepEqual(await codesFor('scheduled'), ['LATER'])
    assert.deepEqual(await codesFor('expired'), ['PAST'])
    assert.deepEqual(await codesFor('archived'), ['GONE'])
  })

  test('searches by code', async ({ client, assert }) => {
    const user = await createAdminUser(['discounts.view'])
    await createDiscount({ code: 'SUMMER', title: 'Summer' })
    await createDiscount({ code: 'WINTER', title: 'Winter' })

    const response = await client
      .get('/admin/discounts/list')
      .qs({ q: 'summ' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    assert.deepEqual(
      response.body().data.map((row: { title: string }) => row.title),
      ['Summer']
    )
  })

  test('views a discount', async ({ client }) => {
    const user = await createAdminUser(['discounts.view'])
    const discount = await createDiscount()

    const response = await client
      .get(`/admin/discounts/view/${discount.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { code: 'SAVE10', status: 'active', usageCount: 0 } })
  })

  test('requires the discounts.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/discounts/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff discounts: store and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a code discount with an uppercased code', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/discounts')
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      data: { code: 'SAVE10', method: 'code', valueType: 'percentage', value: 10 },
    })
  })

  test('creates an automatic discount without a code', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/discounts')
      .json({ ...payload, method: 'automatic', code: null, valueType: 'fixed_amount', value: 50 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({ data: { code: null, method: 'automatic', value: 50 } })
  })

  test('requires a code for code discounts', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/discounts')
      .json({ ...payload, code: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code' }] })
  })

  test('rejects a duplicate code ignoring case', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createDiscount()

    const response = await client
      .post('/admin/discounts')
      .json({ ...payload, code: 'Save10' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code' }] })
  })

  test('rejects a percentage over 100 and an end before the start', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/discounts')
      .json({ ...payload, value: 150, endsAt: '2025-12-31T00:00:00.000Z' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'value' }, { field: 'endsAt' }] })
  })

  test('allows a fixed amount over 100', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/discounts')
      .json({ ...payload, valueType: 'fixed_amount', value: 250 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
  })

  test('requires the discounts.create permission', async ({ client }) => {
    const user = await createAdminUser(['discounts.view'])

    const response = await client
      .post('/admin/discounts')
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('updates a discount and keeps its own code', async ({ client }) => {
    const user = await createAdminUser('admin')
    const discount = await createDiscount()

    const response = await client
      .put(`/admin/discounts/${discount.id}`)
      .json({ ...payload, title: 'Fifteen off', value: 15, usageLimit: 100 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: { title: 'Fifteen off', code: 'SAVE10', value: 15, usageLimit: 100 },
    })
  })
})

test.group('Staff discounts: archive and unarchive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('archives a discount, blocks edits, then restores it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const discount = await createDiscount()

    const archived = await client
      .post(`/admin/discounts/${discount.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.equal(archived.body().data.status, 'archived')

    const update = await client
      .put(`/admin/discounts/${discount.id}`)
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    update.assertStatus(422)

    const restored = await client
      .post(`/admin/discounts/${discount.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.equal(restored.body().data.status, 'active')
  })

  test('refuses to unarchive an active discount', async ({ client }) => {
    const user = await createAdminUser('admin')
    const discount = await createDiscount()

    const response = await client
      .post(`/admin/discounts/${discount.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('requires the discounts.archive permission', async ({ client }) => {
    const user = await createAdminUser(['discounts.view', 'discounts.edit'])
    const discount = await createDiscount()

    const response = await client
      .post(`/admin/discounts/${discount.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff discounts: discount types', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  function store(client: any, user: User, body: Record<string, unknown>) {
    return client
      .post('/admin/discounts')
      .json(body)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
  }

  test('creates amount off products and views its targets', async ({ client }) => {
    const user = await createAdminUser('admin')
    await seedOrderSetup()
    const { product } = await createOrderProduct('Mug', 20)

    const created = await store(client, user, {
      ...payload,
      type: 'amount_off_products',
      appliesTo: 'products',
      productIds: [product.id],
    })
    created.assertStatus(201)

    const view = await client
      .get(`/admin/discounts/view/${created.body().data.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    view.assertStatus(200)
    view.assertBodyContains({
      data: {
        type: 'amount_off_products',
        appliesTo: 'products',
        targets: { applies: { products: [{ id: product.id, title: 'Mug' }], collections: [] } },
      },
    })
  })

  test('requires a product for amount off products', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await store(client, user, {
      ...payload,
      type: 'amount_off_products',
      appliesTo: 'products',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'productIds' }] })
  })

  test('requires the buy x get y fields', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await store(client, user, { ...payload, type: 'buy_x_get_y' })

    response.assertStatus(422)
    const fields = response.body().errors.map(({ field }: { field: string }) => field)
    assert.includeMembers(fields, [
      'appliesTo',
      'buyRequirement',
      'buyValue',
      'buyAppliesTo',
      'getQuantity',
    ])
  })

  test('requires whole items for a quantity buy requirement', async ({ client }) => {
    await seedOrderSetup()
    const user = await createAdminUser('admin')
    const { product } = await createOrderProduct('Mug', 20)

    const response = await store(client, user, {
      ...payload,
      type: 'buy_x_get_y',
      value: 100,
      buyRequirement: 'quantity',
      buyValue: 1.5,
      buyAppliesTo: 'products',
      buyProductIds: [product.id],
      appliesTo: 'products',
      productIds: [product.id],
      getQuantity: 1,
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'buyValue' }] })
  })

  test('creates buy x get y with buy and get products', async ({ client }) => {
    const user = await createAdminUser('admin')
    await seedOrderSetup()
    const { product: mug } = await createOrderProduct('Mug', 20)
    const { product: cup } = await createOrderProduct('Cup', 10)

    const response = await store(client, user, {
      ...payload,
      type: 'buy_x_get_y',
      value: 100,
      buyRequirement: 'quantity',
      buyValue: 2,
      buyAppliesTo: 'products',
      buyProductIds: [mug.id],
      appliesTo: 'products',
      productIds: [cup.id],
      getQuantity: 1,
      maxUsesPerOrder: 2,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        type: 'buy_x_get_y',
        buyRequirement: 'quantity',
        buyValue: 2,
        getQuantity: 1,
        maxUsesPerOrder: 2,
      },
    })
  })

  test('creates free shipping without a value', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await store(client, user, {
      ...without('valueType', 'value'),
      type: 'free_shipping',
      maxShippingPrice: 20,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      data: { type: 'free_shipping', value: null, maxShippingPrice: 20 },
    })
  })

  test('requires a value for value-based types', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await store(client, user, without('value'))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'value' }] })
  })

  test('rejects an unknown or missing type', async ({ client }) => {
    const user = await createAdminUser('admin')

    const missing = await store(client, user, without('type'))
    const unknown = await store(client, user, { ...payload, type: 'gift_card' })

    missing.assertStatus(422)
    missing.assertBodyContains({ errors: [{ field: 'type' }] })
    unknown.assertStatus(422)
    unknown.assertBodyContains({ errors: [{ field: 'type' }] })
  })

  test('rejects too many products', async ({ client }) => {
    const user = await createAdminUser('admin')
    const productIds = Array.from(
      { length: 101 },
      (_, index) => `01a11382-716f-7774-83b7-${String(index).padStart(12, '0')}`
    )

    const response = await store(client, user, {
      ...payload,
      type: 'amount_off_products',
      appliesTo: 'products',
      productIds,
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'productIds' }] })
  })

  test('refuses to change the type on update', async ({ client }) => {
    const user = await createAdminUser('admin')
    const discount = await createDiscount()

    const response = await client
      .put(`/admin/discounts/${discount.id}`)
      .json({ ...payload, type: 'free_shipping' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'type' }] })
  })

  test('filters the list by type', async ({ client, assert }) => {
    const user = await createAdminUser(['discounts.view'])
    await createDiscount({ code: 'ORDER' })
    await createDiscount({ code: 'SHIP', type: 'free_shipping' })

    const response = await client
      .get('/admin/discounts/list')
      .qs({ type: 'free_shipping' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((row: { code: string; type: string }) => [row.code, row.type]),
      [['SHIP', 'free_shipping']]
    )
  })
})
