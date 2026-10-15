import { test } from '@japa/runner'
import {
  calculateRefund,
  RefundCalculationError,
  type RefundCalcLine,
  type RefundCalcOrder,
} from '#services/refund_calculator'

function order(overrides: Partial<RefundCalcOrder> = {}): RefundCalcOrder {
  return {
    subtotal: 100,
    discountTotal: 10,
    shippingTotal: 10,
    pricesIncludeTax: false,
    taxRate: 10,
    taxAppliesToShipping: true,
    refundableTotal: 200,
    ...overrides,
  }
}

function orderLine(overrides: Partial<RefundCalcLine> & { id: string }): RefundCalcLine {
  return {
    unitPrice: 50,
    quantity: 1,
    refundedQuantity: 0,
    taxable: true,
    discountAllocation: 0,
    ...overrides,
  }
}

/** A $50 shirt that took the whole $10 discount, and two $25 mugs that took none. */
const allocatedLines = [
  orderLine({ id: 'shirt', unitPrice: 50, quantity: 1, discountAllocation: 10 }),
  orderLine({ id: 'mug', unitPrice: 25, quantity: 2, discountAllocation: 0 }),
]

function errorOf(run: () => unknown) {
  try {
    run()
  } catch (error) {
    if (error instanceof RefundCalculationError) return { field: error.field, message: error.message }
    throw error
  }
  return null
}

test.group('calculateRefund', () => {
  test('refunds each unit after its own line’s discount', ({ assert }) => {
    const result = calculateRefund(order(), allocatedLines, {
      lines: [
        { lineItemId: 'shirt', quantity: 1 },
        { lineItemId: 'mug', quantity: 1 },
      ],
      shipping: 0,
      refundedShipping: 0,
    })

    assert.deepEqual(result.lines, [
      { lineItemId: 'shirt', quantity: 1, amount: 44 },
      { lineItemId: 'mug', quantity: 1, amount: 27.5 },
    ])
    assert.equal(result.subtotal, 65)
    assert.equal(result.tax, 6.5)
    assert.equal(result.total, 71.5)
  })

  test('spreads a line’s discount evenly over its units', ({ assert }) => {
    const result = calculateRefund(
      order({ subtotal: 50, discountTotal: 5 }),
      [orderLine({ id: 'mug', unitPrice: 25, quantity: 2, discountAllocation: 5 })],
      { lines: [{ lineItemId: 'mug', quantity: 1 }], shipping: 0, refundedShipping: 0 }
    )

    assert.equal(result.subtotal, 22.5)
  })

  test('falls back to the order-wide ratio when no line has a share', ({ assert }) => {
    const result = calculateRefund(
      order(),
      allocatedLines.map((line) => ({ ...line, discountAllocation: 0 })),
      { lines: [{ lineItemId: 'mug', quantity: 1 }], shipping: 0, refundedShipping: 0 }
    )

    assert.equal(result.subtotal, 22.5)
    assert.equal(result.tax, 2.25)
    assert.equal(result.total, 24.75)
  })

  test('adds shipping with its tax and caps the total', ({ assert }) => {
    const full = calculateRefund(order(), allocatedLines, {
      lines: [],
      shipping: 10,
      refundedShipping: 0,
    })
    const capped = calculateRefund(order({ refundableTotal: 5 }), allocatedLines, {
      lines: [],
      shipping: 10,
      refundedShipping: 0,
    })

    assert.equal(full.total, 11)
    assert.equal(full.shippingRefundable, 10)
    assert.equal(capped.total, 5)
    assert.equal(capped.maximum, 5)
  })

  test('only refunds shipping that was charged after its discount', ({ assert }) => {
    const freeShipping = order({ shippingTotal: 0 })

    assert.deepEqual(
      errorOf(() =>
        calculateRefund(freeShipping, allocatedLines, {
          lines: [],
          shipping: 1,
          refundedShipping: 0,
        })
      ),
      { field: 'shipping', message: 'Only 0.00 of shipping can still be refunded' }
    )
  })

  test('adds no tax when prices include it', ({ assert }) => {
    const result = calculateRefund(order({ pricesIncludeTax: true }), allocatedLines, {
      lines: [{ lineItemId: 'shirt', quantity: 1 }],
      shipping: 0,
      refundedShipping: 0,
    })

    assert.equal(result.tax, 0)
    assert.equal(result.total, 40)
  })

  test('rejects unknown lines and quantities over what is left', ({ assert }) => {
    const refunded = [{ ...allocatedLines[1], refundedQuantity: 2 }]

    assert.deepEqual(
      errorOf(() =>
        calculateRefund(order(), allocatedLines, {
          lines: [{ lineItemId: 'nope', quantity: 1 }],
          shipping: 0,
          refundedShipping: 0,
        })
      ),
      { field: 'lines.0.lineItemId', message: 'This item is not on the order' }
    )
    assert.deepEqual(
      errorOf(() =>
        calculateRefund(order(), allocatedLines, {
          lines: [{ lineItemId: 'mug', quantity: 3 }],
          shipping: 0,
          refundedShipping: 0,
        })
      ),
      { field: 'lines.0.quantity', message: 'Only 2 can still be refunded' }
    )
    assert.deepEqual(
      errorOf(() =>
        calculateRefund(order(), refunded, {
          lines: [{ lineItemId: 'mug', quantity: 1 }],
          shipping: 0,
          refundedShipping: 0,
        })
      ),
      { field: 'lines.0.quantity', message: 'This item is already refunded' }
    )
  })
})
