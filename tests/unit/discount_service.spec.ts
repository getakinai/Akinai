import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import Discount from '#models/discount'
import CollectionService from '#services/collection_service'
import DiscountService, { type DiscountInput } from '#services/discount_service'
import { createOrderProduct, seedOrderSetup } from '#tests/helpers/orders'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

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

async function manualCollection(title: string, productIds: string[]) {
  const collectionService = await app.container.make(CollectionService)
  const collection = await collectionService.create({
    type: 'manual',
    title,
    description: null,
    status: 'active',
  })
  await collectionService.addProducts(collection, productIds)
  return collection
}

function input(overrides: Partial<DiscountInput> = {}): DiscountInput {
  return {
    title: 'Ten off',
    code: 'save10',
    method: 'code',
    valueType: 'percentage',
    value: 10,
    minSubtotal: null,
    usageLimit: null,
    oncePerCustomer: false,
    startsAt: DateTime.now().minus({ days: 1 }),
    endsAt: null,
    ...overrides,
  }
}

test.group('DiscountService: create and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('create uppercases the code', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    const discount = await discountService.create(input())

    assert.equal(discount.code, 'SAVE10')
    assert.equal(discount.usageCount, 0)
    assert.isNull(discount.archivedAt)
  })

  test('automatic discounts never keep a code', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    const discount = await discountService.create(input({ method: 'automatic' }))

    assert.isNull(discount.code)
  })

  test('archive and unarchive set and clear archivedAt', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    const discount = await discountService.create(input())

    const archived = await discountService.archive(discount)
    assert.isNotNull(archived.archivedAt)
    assert.equal(archived.statusAt(), 'archived')

    const restored = await discountService.unarchive(discount)
    assert.isNull(restored.archivedAt)
    assert.equal(restored.statusAt(), 'active')
  })
})

test.group('DiscountService: findApplicableByCode', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('matches an active code ignoring case', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    const discount = await discountService.create(input())

    const found = await discountService.findApplicableByCode('  save10 ', 100)

    assert.equal(found?.id, discount.id)
  })

  test('requires the minimum subtotal', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ minSubtotal: 500 }))

    assert.isNull(await discountService.findApplicableByCode('SAVE10', 499.99))
    assert.isNotNull(await discountService.findApplicableByCode('SAVE10', 500))
  })

  test('ignores scheduled, expired, used-up and archived discounts', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(
      input({ code: 'LATER', startsAt: DateTime.now().plus({ days: 1 }) })
    )
    await discountService.create(
      input({ code: 'ENDED', endsAt: DateTime.now().minus({ hours: 1 }) })
    )
    const usedUp = await discountService.create(input({ code: 'USEDUP', usageLimit: 1 }))
    await Discount.query().where('id', usedUp.id).update({ usage_count: 1 })
    await discountService.archive(await discountService.create(input({ code: 'GONE' })))

    for (const code of ['LATER', 'ENDED', 'USEDUP', 'GONE']) {
      assert.isNull(await discountService.findApplicableByCode(code, 100), code)
    }
  })

  test('returns null for an empty code', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.isNull(await discountService.findApplicableByCode('   ', 100))
  })
})

test.group('DiscountService: amountFor', () => {
  test('takes a percentage of the subtotal, rounded to cents', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.equal(discountService.amountFor({ valueType: 'percentage', value: 15 }, 99.99), 15)
    assert.equal(discountService.amountFor({ valueType: 'percentage', value: 12.5 }, 10.1), 1.26)
  })

  test('caps a fixed amount at the subtotal', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.equal(discountService.amountFor({ valueType: 'fixed_amount', value: 50 }, 200), 50)
    assert.equal(discountService.amountFor({ valueType: 'fixed_amount', value: 50 }, 30), 30)
  })

  test('returns 0 for an empty order', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.equal(discountService.amountFor({ valueType: 'fixed_amount', value: 50 }, 0), 0)
  })
})

test.group('Discount: statusAt', () => {
  test('derives the status from dates, usage and archiving', ({ assert }) => {
    const now = DateTime.fromISO('2026-06-01T00:00:00Z')
    const discount = new Discount()
    discount.merge({
      startsAt: now.minus({ days: 1 }),
      endsAt: null,
      archivedAt: null,
      usageLimit: null,
      usageCount: 0,
    })

    assert.equal(discount.statusAt(now), 'active')

    discount.startsAt = now.plus({ days: 1 })
    assert.equal(discount.statusAt(now), 'scheduled')

    discount.startsAt = now.minus({ days: 2 })
    discount.endsAt = now
    assert.equal(discount.statusAt(now), 'expired')

    discount.endsAt = null
    discount.usageLimit = 3
    discount.usageCount = 3
    assert.equal(discount.statusAt(now), 'expired')

    discount.archivedAt = now
    assert.equal(discount.statusAt(now), 'archived')
  })
})

test.group('DiscountService: discount types', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('saves amount off products with its product targets', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await seedOrderSetup()
    const { product } = await createOrderProduct('Mug', 20)

    const created = await discountService.create(
      input({ type: 'amount_off_products', appliesTo: 'products', productIds: [product.id] })
    )
    const discount = await discountService.find(created.id)

    assert.equal(discount?.type, 'amount_off_products')
    assert.equal(discount?.appliesTo, 'products')
    assert.deepEqual(
      discount?.targets.map(({ role, productId, collectionId }) => [role, productId, collectionId]),
      [['applies', product.id, null]]
    )
  })

  test('requires at least one target of the chosen kind', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.deepEqual(
      await fieldsOf(
        discountService.create(input({ type: 'amount_off_products', appliesTo: 'products' }))
      ),
      ['productIds']
    )
    assert.deepEqual(
      await fieldsOf(
        discountService.create(
          input({ type: 'amount_off_products', appliesTo: 'collections', productIds: [UNKNOWN_ID] })
        )
      ),
      ['collectionIds']
    )
  })

  test('rejects targets that do not exist', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    assert.deepEqual(
      await fieldsOf(
        discountService.create(
          input({ type: 'amount_off_products', appliesTo: 'products', productIds: [UNKNOWN_ID] })
        )
      ),
      ['productIds']
    )
    assert.deepEqual(
      await fieldsOf(
        discountService.create(
          input({
            type: 'buy_x_get_y',
            buyRequirement: 'quantity',
            buyValue: 2,
            buyAppliesTo: 'collections',
            buyCollectionIds: [UNKNOWN_ID],
            appliesTo: 'collections',
            collectionIds: [UNKNOWN_ID],
            getQuantity: 1,
          })
        )
      ),
      ['buyCollectionIds']
    )
  })

  test('saves buy x get y with buy and get targets', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await seedOrderSetup()
    const { product: mug } = await createOrderProduct('Mug', 20)
    const { product: cup } = await createOrderProduct('Cup', 10)
    const kitchen = await manualCollection('Kitchen', [cup.id])

    const created = await discountService.create(
      input({
        type: 'buy_x_get_y',
        valueType: 'percentage',
        value: 100,
        buyRequirement: 'quantity',
        buyValue: 2,
        buyAppliesTo: 'products',
        buyProductIds: [mug.id],
        appliesTo: 'collections',
        collectionIds: [kitchen.id],
        getQuantity: 1,
        maxUsesPerOrder: 3,
      })
    )
    const discount = await discountService.find(created.id)

    assert.equal(discount?.buyRequirement, 'quantity')
    assert.equal(discount?.buyValue, 2)
    assert.equal(discount?.getQuantity, 1)
    assert.equal(discount?.maxUsesPerOrder, 3)
    assert.sameDeepMembers(
      discount!.targets.map(({ role, productId, collectionId }) => ({
        role,
        productId,
        collectionId,
      })),
      [
        { role: 'buy', productId: mug.id, collectionId: null },
        { role: 'get', productId: null, collectionId: kitchen.id },
      ]
    )
  })

  test('drops the fields a type does not use', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)

    const shipping = await discountService.create(
      input({
        type: 'free_shipping',
        valueType: 'fixed_amount',
        value: 25,
        maxShippingPrice: 20,
        getQuantity: 2,
      })
    )
    const order = await discountService.create(
      input({ code: 'ORDER', maxShippingPrice: 20, buyValue: 3, maxUsesPerOrder: 4 })
    )

    assert.isNull(shipping.value)
    assert.equal(shipping.valueType, 'percentage')
    assert.equal(shipping.maxShippingPrice, 20)
    assert.isNull(shipping.getQuantity)
    assert.equal(order.type, 'amount_off_order')
    assert.isNull(order.maxShippingPrice)
    assert.isNull(order.buyValue)
    assert.isNull(order.maxUsesPerOrder)
  })

  test('keeps the type on update and replaces targets', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await seedOrderSetup()
    const { product: mug } = await createOrderProduct('Mug', 20)
    const { product: cup } = await createOrderProduct('Cup', 10)
    const created = await discountService.create(
      input({ type: 'amount_off_products', appliesTo: 'products', productIds: [mug.id] })
    )

    assert.deepEqual(
      await fieldsOf(discountService.update(created, input({ type: 'free_shipping' }))),
      ['type']
    )

    await discountService.update(created, input({ appliesTo: 'products', productIds: [cup.id] }))
    const updated = await discountService.find(created.id)

    assert.equal(updated?.type, 'amount_off_products')
    assert.deepEqual(
      updated?.targets.map(({ productId }) => productId),
      [cup.id]
    )
  })
})

test.group('DiscountService: resolveForCart', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  const cart = (subtotal = 100) => ({
    lines: [{ productId: null, unitPrice: subtotal, quantity: 1 }],
    subtotal,
    shippingPrice: 10,
    customerId: null,
  })

  test('a code fills the main slot', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input())

    const result = await discountService.resolveForCart({
      ...cart(),
      code: ' save10 ',
      applyAutomatic: false,
    })

    assert.isNull(result.codeError)
    assert.equal(result.main?.discount.code, 'SAVE10')
    assert.equal(result.main?.application.amount, 10)
    assert.isNull(result.shipping)
  })

  test('a free shipping code fills the shipping slot', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ type: 'free_shipping', code: 'SHIPFREE' }))

    const result = await discountService.resolveForCart({
      ...cart(),
      code: 'SHIPFREE',
      applyAutomatic: false,
    })

    assert.isNull(result.codeError)
    assert.isNull(result.main)
    assert.equal(result.shipping?.discount.code, 'SHIPFREE')
    assert.equal(result.shipping?.application.shippingAmount, 10)
  })

  test('automatic discounts fill the empty slots with the best saving', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ method: 'automatic', title: 'Ten percent' }))
    await discountService.create(
      input({ method: 'automatic', title: 'Fifteen off', valueType: 'fixed_amount', value: 15 })
    )
    await discountService.create(
      input({ method: 'automatic', title: 'Free shipping', type: 'free_shipping' })
    )

    const result = await discountService.resolveForCart({ ...cart(), applyAutomatic: true })

    assert.equal(result.main?.discount.title, 'Fifteen off')
    assert.equal(result.main?.application.amount, 15)
    assert.equal(result.shipping?.discount.title, 'Free shipping')
    assert.isNull(result.codeError)
  })

  test('a code and an automatic discount stack across slots', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ type: 'free_shipping', code: 'SHIPFREE' }))
    await discountService.create(input({ method: 'automatic', title: 'Auto ten' }))

    const result = await discountService.resolveForCart({
      ...cart(),
      code: 'SHIPFREE',
      applyAutomatic: true,
    })

    assert.equal(result.main?.discount.title, 'Auto ten')
    assert.equal(result.shipping?.discount.code, 'SHIPFREE')
  })

  test('the code wins its slot over a bigger automatic discount', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input())
    await discountService.create(
      input({ method: 'automatic', title: 'Half off', value: 50 })
    )

    const result = await discountService.resolveForCart({
      ...cart(),
      code: 'SAVE10',
      applyAutomatic: true,
    })

    assert.equal(result.main?.discount.code, 'SAVE10')
  })

  test('skips automatic discounts unless asked, and below their minimum', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ method: 'automatic', minSubtotal: 200 }))

    const drafts = await discountService.resolveForCart({ ...cart(500), applyAutomatic: false })
    const small = await discountService.resolveForCart({ ...cart(100), applyAutomatic: true })
    const big = await discountService.resolveForCart({ ...cart(500), applyAutomatic: true })

    assert.isNull(drafts.main)
    assert.isNull(small.main)
    assert.equal(big.main?.application.amount, 50)
  })

  test('explains why a code does not apply', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await seedOrderSetup()
    const { product } = await createOrderProduct('Mug', 20)
    await discountService.create(input({ minSubtotal: 500 }))
    await discountService.create(
      input({ code: 'MUGS', type: 'amount_off_products', appliesTo: 'products', productIds: [product.id] })
    )
    await discountService.create(
      input({ code: 'CHEAPSHIP', type: 'free_shipping', maxShippingPrice: 5 })
    )

    const errorFor = async (code: string) => {
      const result = await discountService.resolveForCart({ ...cart(), code, applyAutomatic: false })
      return result.codeError
    }

    assert.equal(await errorFor('NOPE'), 'This code isn’t valid for this order')
    assert.equal(await errorFor('SAVE10'), 'This code isn’t valid for this order')
    assert.equal(await errorFor('MUGS'), 'This code doesn’t apply to the items in your cart')
    assert.equal(await errorFor('CHEAPSHIP'), 'This code doesn’t cover the chosen shipping rate')
  })

  test('accepts a free shipping code before a rate is chosen', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await discountService.create(input({ code: 'CHEAPSHIP', type: 'free_shipping', maxShippingPrice: 5 }))

    const result = await discountService.resolveForCart({
      ...cart(),
      shippingPrice: null,
      code: 'CHEAPSHIP',
      applyAutomatic: false,
    })

    assert.isNull(result.codeError)
    assert.equal(result.shipping?.application.shippingAmount, 0)
  })

  test('matches cart lines through a manual collection', async ({ assert }) => {
    const discountService = await app.container.make(DiscountService)
    await seedOrderSetup()
    const { product: mug } = await createOrderProduct('Mug', 20)
    const { product: cup } = await createOrderProduct('Cup', 30)
    const kitchen = await manualCollection('Kitchen', [mug.id])
    await discountService.create(
      input({
        code: 'KITCHEN',
        type: 'amount_off_products',
        valueType: 'fixed_amount',
        value: 5,
        appliesTo: 'collections',
        collectionIds: [kitchen.id],
      })
    )

    const result = await discountService.resolveForCart({
      lines: [
        { productId: mug.id, unitPrice: 20, quantity: 1 },
        { productId: cup.id, unitPrice: 30, quantity: 1 },
      ],
      subtotal: 50,
      shippingPrice: null,
      customerId: null,
      code: 'KITCHEN',
      applyAutomatic: false,
    })

    assert.deepEqual(result.main?.application.lineAllocations, [5, 0])
  })
})
