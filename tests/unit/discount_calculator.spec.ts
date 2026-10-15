import { test } from '@japa/runner'
import {
  allocate,
  applyDiscount,
  targetCollectionIds,
  type DiscountCartLine,
  type DiscountRule,
  type DiscountRuleTarget,
} from '#services/discount_calculator'

const MUG = '01a11382-716f-7774-83b7-09aa5f030a01'
const CUP = '01a11382-716f-7774-83b7-09aa5f030a02'
const BOWL = '01a11382-716f-7774-83b7-09aa5f030a03'
const KITCHEN = '01a11382-716f-7774-83b7-09aa5f030b01'
const SALE = '01a11382-716f-7774-83b7-09aa5f030b02'

function rule(overrides: Partial<DiscountRule> = {}): DiscountRule {
  return {
    type: 'amount_off_order',
    valueType: 'percentage',
    value: 10,
    appliesTo: null,
    buyRequirement: null,
    buyValue: null,
    buyAppliesTo: null,
    getQuantity: null,
    maxUsesPerOrder: null,
    maxShippingPrice: null,
    targets: [],
    ...overrides,
  }
}

function product(role: DiscountRuleTarget['role'], productId: string): DiscountRuleTarget {
  return { role, productId, collectionId: null }
}

function collection(role: DiscountRuleTarget['role'], collectionId: string): DiscountRuleTarget {
  return { role, productId: null, collectionId }
}

function line(productId: string | null, unitPrice: number, quantity = 1): DiscountCartLine {
  return { productId, unitPrice, quantity }
}

/** "Buy `buyValue` items, get `getQuantity` free" on one product. */
function buyGetFree(buyValue: number, getQuantity: number, extra: Partial<DiscountRule> = {}) {
  return rule({
    type: 'buy_x_get_y',
    valueType: 'percentage',
    value: 100,
    buyRequirement: 'quantity',
    buyValue,
    getQuantity,
    targets: [product('buy', MUG), product('get', MUG)],
    ...extra,
  })
}

test.group('discount calculator: allocate', () => {
  test('splits an amount in proportion so the shares add up exactly', ({ assert }) => {
    const shares = allocate(10, [1, 1, 1])

    assert.deepEqual(shares, [3.34, 3.33, 3.33])
    assert.equal(Math.round(shares.reduce((sum, share) => sum + share, 0) * 100), 1000)
  })

  test('never gives leftover cents to a zero-weight line', ({ assert }) => {
    assert.deepEqual(allocate(1, [0, 3]), [0, 1])
    assert.deepEqual(allocate(0.01, [0, 1, 1]), [0, 0.01, 0])
  })

  test('returns zeros for no amount or no weight', ({ assert }) => {
    assert.deepEqual(allocate(0, [10, 20]), [0, 0])
    assert.deepEqual(allocate(5, [0, 0]), [0, 0])
    assert.deepEqual(allocate(5, []), [])
  })
})

test.group('discount calculator: amount off order', () => {
  test('takes a percentage of the subtotal, split across lines', ({ assert }) => {
    const result = applyDiscount(rule(), [line(MUG, 30), line(CUP, 35, 2)], null)

    assert.equal(result.amount, 10)
    assert.deepEqual(result.lineAllocations, [3, 7])
    assert.equal(result.shippingAmount, 0)
  })

  test('caps a fixed amount at the subtotal', ({ assert }) => {
    const result = applyDiscount(
      rule({ valueType: 'fixed_amount', value: 500 }),
      [line(MUG, 60), line(null, 40)],
      null
    )

    assert.equal(result.amount, 100)
    assert.deepEqual(result.lineAllocations, [60, 40])
  })

  test('takes nothing without a value', ({ assert }) => {
    const result = applyDiscount(rule({ value: null }), [line(MUG, 30)], null)

    assert.equal(result.amount, 0)
    assert.deepEqual(result.lineAllocations, [0])
  })
})

test.group('discount calculator: amount off products', () => {
  test('only discounts lines of the chosen products', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'amount_off_products',
        valueType: 'percentage',
        value: 25,
        appliesTo: 'products',
        targets: [product('applies', MUG)],
      }),
      [line(MUG, 20, 2), line(CUP, 60)],
      null
    )

    assert.equal(result.amount, 10)
    assert.deepEqual(result.lineAllocations, [10, 0])
  })

  test('matches lines through collection membership', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'amount_off_products',
        valueType: 'fixed_amount',
        value: 10,
        appliesTo: 'collections',
        targets: [collection('applies', KITCHEN)],
      }),
      [line(MUG, 20), line(CUP, 60)],
      null,
      new Map([[KITCHEN, new Set([CUP])]])
    )

    assert.deepEqual(result.lineAllocations, [0, 10])
  })

  test('caps a fixed amount at the eligible lines only', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'amount_off_products',
        valueType: 'fixed_amount',
        value: 50,
        appliesTo: 'products',
        targets: [product('applies', MUG)],
      }),
      [line(MUG, 15), line(CUP, 100)],
      null
    )

    assert.equal(result.amount, 15)
    assert.deepEqual(result.lineAllocations, [15, 0])
  })

  test('never matches lines whose product was deleted', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'amount_off_products',
        appliesTo: 'products',
        targets: [product('applies', MUG)],
      }),
      [line(null, 50)],
      null
    )

    assert.equal(result.amount, 0)
  })

  test('takes nothing when no line matches', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'amount_off_products',
        appliesTo: 'collections',
        targets: [collection('applies', KITCHEN)],
      }),
      [line(MUG, 50)],
      null,
      new Map()
    )

    assert.equal(result.amount, 0)
    assert.deepEqual(result.lineAllocations, [0])
  })
})

test.group('discount calculator: buy x get y', () => {
  test('needs the bought and the free items in the cart', ({ assert }) => {
    const free = buyGetFree(2, 1)

    assert.equal(applyDiscount(free, [line(MUG, 10, 2)], null).amount, 0)
    assert.equal(applyDiscount(free, [line(MUG, 10, 3)], null).amount, 10)
    assert.equal(applyDiscount(free, [line(MUG, 10, 6)], null).amount, 20)
  })

  test('stops at the maximum uses per order', ({ assert }) => {
    assert.equal(applyDiscount(buyGetFree(2, 1), [line(MUG, 10, 9)], null).amount, 30)
    assert.equal(
      applyDiscount(buyGetFree(2, 1, { maxUsesPerOrder: 2 }), [line(MUG, 10, 9)], null).amount,
      20
    )
  })

  test('discounts other products bought with the buy items', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'buy_x_get_y',
        valueType: 'percentage',
        value: 50,
        buyRequirement: 'quantity',
        buyValue: 2,
        getQuantity: 1,
        targets: [product('buy', MUG), product('get', CUP)],
      }),
      [line(MUG, 20, 2), line(CUP, 10, 3)],
      null
    )

    assert.equal(result.amount, 5)
    assert.deepEqual(result.lineAllocations, [0, 5])
  })

  test('buys with the priciest items and discounts the cheapest', ({ assert }) => {
    const result = applyDiscount(
      rule({
        type: 'buy_x_get_y',
        valueType: 'percentage',
        value: 100,
        buyRequirement: 'quantity',
        buyValue: 2,
        getQuantity: 1,
        targets: [collection('buy', KITCHEN), collection('get', KITCHEN)],
      }),
      [line(MUG, 30), line(CUP, 10), line(BOWL, 20)],
      null,
      new Map([[KITCHEN, new Set([MUG, CUP, BOWL])]])
    )

    assert.deepEqual(result.lineAllocations, [0, 10, 0])
  })

  test('counts uses by amount spent', ({ assert }) => {
    const spend = rule({
      type: 'buy_x_get_y',
      valueType: 'percentage',
      value: 100,
      buyRequirement: 'amount',
      buyValue: 50,
      getQuantity: 1,
      targets: [product('buy', MUG), product('get', CUP)],
    })

    assert.equal(applyDiscount(spend, [line(MUG, 30, 1), line(CUP, 8, 2)], null).amount, 0)
    assert.deepEqual(
      applyDiscount(spend, [line(MUG, 30, 2), line(CUP, 8, 2)], null).lineAllocations,
      [0, 8]
    )
    assert.equal(applyDiscount(spend, [line(MUG, 30, 4), line(CUP, 8, 3)], null).amount, 16)
  })

  test('caps a fixed amount off at each item’s price', ({ assert }) => {
    const result = applyDiscount(
      buyGetFree(1, 1, { valueType: 'fixed_amount', value: 15 }),
      [line(MUG, 10, 2)],
      null
    )

    assert.equal(result.amount, 10)
  })

  test('handles large quantities', ({ assert }) => {
    const result = applyDiscount(buyGetFree(2, 1), [line(MUG, 1, 3_000_000)], null)

    assert.equal(result.amount, 1_000_000)
  })

  test('takes nothing when the rule is incomplete', ({ assert }) => {
    const result = applyDiscount(buyGetFree(2, 1, { getQuantity: null }), [line(MUG, 10, 9)], null)

    assert.equal(result.amount, 0)
  })
})

test.group('discount calculator: free shipping', () => {
  const freeShipping = (maxShippingPrice: number | null = null) =>
    rule({ type: 'free_shipping', value: null, maxShippingPrice })

  test('takes the whole shipping price off', ({ assert }) => {
    const result = applyDiscount(freeShipping(), [line(MUG, 20)], 12.5)

    assert.equal(result.shippingAmount, 12.5)
    assert.equal(result.amount, 0)
    assert.deepEqual(result.lineAllocations, [0])
  })

  test('only covers rates up to the maximum', ({ assert }) => {
    assert.equal(applyDiscount(freeShipping(10), [line(MUG, 20)], 10).shippingAmount, 10)
    assert.equal(applyDiscount(freeShipping(10), [line(MUG, 20)], 10.01).shippingAmount, 0)
  })

  test('takes nothing before a rate is chosen or when shipping is free', ({ assert }) => {
    assert.equal(applyDiscount(freeShipping(), [line(MUG, 20)], null).shippingAmount, 0)
    assert.equal(applyDiscount(freeShipping(), [line(MUG, 20)], 0).shippingAmount, 0)
  })
})

test.group('discount calculator: targetCollectionIds', () => {
  test('lists each target collection once', ({ assert }) => {
    const ids = targetCollectionIds([
      rule({ targets: [collection('buy', KITCHEN), product('get', MUG)] }),
      rule({ targets: [collection('applies', KITCHEN), collection('get', SALE)] }),
    ])

    assert.sameMembers(ids, [KITCHEN, SALE])
  })
})
