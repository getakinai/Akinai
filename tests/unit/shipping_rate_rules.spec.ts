import { test } from '@japa/runner'
import {
  applyFreeShippingProducts,
  rateMatches,
  type CartShippingMetrics,
  type ShippingRateConditions,
} from '#services/helpers/shipping_rate_rules'

const noLimits: ShippingRateConditions = {
  minSubtotal: null,
  maxSubtotal: null,
  minWeight: null,
  maxWeight: null,
  minItems: null,
  maxItems: null,
}

const noBounds = { minSubtotal: null, maxSubtotal: null }

const cart = (overrides: Partial<CartShippingMetrics> = {}): CartShippingMetrics => ({
  subtotal: 100,
  weight: 1,
  itemCount: 2,
  allShipFree: false,
  ...overrides,
})

test.group('shipping rate rules: rateMatches', () => {
  test('a rate without limits matches every cart', ({ assert }) => {
    assert.isTrue(rateMatches(noLimits, cart(), noBounds))
    assert.isTrue(rateMatches(noLimits, cart({ subtotal: 0, weight: 0, itemCount: 0 }), noBounds))
  })

  test('checks the subtotal against the given bounds inclusively', ({ assert }) => {
    const bounds = { minSubtotal: 50, maxSubtotal: 100 }

    assert.isFalse(rateMatches(noLimits, cart({ subtotal: 49.99 }), bounds))
    assert.isTrue(rateMatches(noLimits, cart({ subtotal: 50 }), bounds))
    assert.isTrue(rateMatches(noLimits, cart({ subtotal: 100 }), bounds))
    assert.isFalse(rateMatches(noLimits, cart({ subtotal: 100.01 }), bounds))
  })

  test('uses the given bounds, not the rate subtotal bounds', ({ assert }) => {
    const rate = { ...noLimits, minSubtotal: 1000 }

    assert.isTrue(rateMatches(rate, cart({ subtotal: 60 }), { minSubtotal: 50, maxSubtotal: null }))
  })

  test('checks the cart weight inclusively', ({ assert }) => {
    const rate = { ...noLimits, minWeight: 1, maxWeight: 2.5 }

    assert.isFalse(rateMatches(rate, cart({ weight: 0.999 }), noBounds))
    assert.isTrue(rateMatches(rate, cart({ weight: 1 }), noBounds))
    assert.isTrue(rateMatches(rate, cart({ weight: 2.5 }), noBounds))
    assert.isFalse(rateMatches(rate, cart({ weight: 2.501 }), noBounds))
  })

  test('checks the item count inclusively', ({ assert }) => {
    const rate = { ...noLimits, minItems: 3, maxItems: 5 }

    assert.isFalse(rateMatches(rate, cart({ itemCount: 2 }), noBounds))
    assert.isTrue(rateMatches(rate, cart({ itemCount: 3 }), noBounds))
    assert.isTrue(rateMatches(rate, cart({ itemCount: 5 }), noBounds))
    assert.isFalse(rateMatches(rate, cart({ itemCount: 6 }), noBounds))
  })

  test('requires every limit set to match', ({ assert }) => {
    const rate = { ...noLimits, maxWeight: 2, minItems: 3 }
    const bounds = { minSubtotal: 50, maxSubtotal: null }

    assert.isTrue(rateMatches(rate, cart({ subtotal: 50, weight: 2, itemCount: 3 }), bounds))
    assert.isFalse(rateMatches(rate, cart({ subtotal: 40, weight: 2, itemCount: 3 }), bounds))
    assert.isFalse(rateMatches(rate, cart({ subtotal: 50, weight: 3, itemCount: 3 }), bounds))
    assert.isFalse(rateMatches(rate, cart({ subtotal: 50, weight: 2, itemCount: 2 }), bounds))
  })
})

test.group('shipping rate rules: applyFreeShippingProducts', () => {
  test('makes only the cheapest rate free when every item ships free', ({ assert }) => {
    const rates = [{ price: 10 }, { price: 25 }]

    const result = applyFreeShippingProducts(rates, cart({ allShipFree: true }))

    assert.deepEqual(
      result.map(({ price }) => price),
      [0, 25]
    )
  })

  test('keeps the prices when some items do not ship free', ({ assert }) => {
    const rates = [{ price: 10 }, { price: 25 }]

    applyFreeShippingProducts(rates, cart({ allShipFree: false }))

    assert.deepEqual(
      rates.map(({ price }) => price),
      [10, 25]
    )
  })

  test('handles no rates', ({ assert }) => {
    assert.deepEqual(applyFreeShippingProducts([], cart({ allShipFree: true })), [])
  })
})
