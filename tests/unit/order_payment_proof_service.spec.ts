import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import Order from '#models/order'
import OrderNote from '#models/order_note'
import OrderPaymentProof from '#models/order_payment_proof'
import OrderNoteService from '#services/order_note_service'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

async function placedOrder(options: Parameters<typeof createPlacedOrder>[1] = {}) {
  const { customer } = await createCustomerAccount()
  const order = await createPlacedOrder(customer, options)
  return { customer, order }
}

async function fieldOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) return error.messages[0]?.field
    throw error
  }
  return undefined
}

test.group('Order.acceptsPaymentProof', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('is true for open bank transfer orders that are pending or submitted', async ({
    assert,
  }) => {
    const { order } = await placedOrder()
    assert.isTrue(order.acceptsPaymentProof)

    order.paymentStatus = 'payment_submitted'
    assert.isTrue(order.acceptsPaymentProof)
  })

  test('is false for paid, card or closed orders', async ({ assert }) => {
    const { order } = await placedOrder()
    order.paymentStatus = 'paid'
    assert.isFalse(order.acceptsPaymentProof)

    const { order: card } = await placedOrder({ paymentMethod: 'stripe' })
    assert.isFalse(card.acceptsPaymentProof)

    const { order: cancelled } = await placedOrder({ status: 'cancelled' })
    assert.isFalse(cancelled.acceptsPaymentProof)
  })
})

test.group('OrderPaymentProofService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('submit needs a screenshot or details', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const { order } = await placedOrder()

    assert.equal(await fieldOf(service.submit(order, { image: null, details: null })), 'details')
    assert.isNull(await OrderPaymentProof.findBy('orderId', order.id))
  })

  test('submit rejects orders that no longer accept proof', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const { order } = await placedOrder({ paymentMethod: 'stripe' })

    assert.equal(await fieldOf(service.submit(order, { image: null, details: 'Paid' })), 'order')
  })

  test('submit saves the details and moves the order to payment_submitted', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const { order } = await placedOrder()

    await service.submit(order, { image: null, details: 'Ref 1234' })

    const fresh = await Order.findOrFail(order.id)
    assert.equal(fresh.paymentStatus, 'payment_submitted')
    const proof = await OrderPaymentProof.findByOrFail('orderId', order.id)
    assert.equal(proof.details, 'Ref 1234')
    assert.isNull(proof.imageKey)
    assert.isNull(proof.reviewedAt)
  })

  test('review approves to paid and rejects back to pending', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const user = await createAdminUser(['orders.view', 'orders.edit'])

    const { order: approved } = await placedOrder()
    await service.submit(approved, { image: null, details: 'Paid' })
    await service.review(approved, user.id, { decision: 'approve' })
    assert.equal((await Order.findOrFail(approved.id)).paymentStatus, 'paid')

    const { order: rejected } = await placedOrder()
    await service.submit(rejected, { image: null, details: 'Paid' })
    await service.review(rejected, user.id, { decision: 'reject', reason: 'Not received' })
    assert.equal((await Order.findOrFail(rejected.id)).paymentStatus, 'pending')
    const proof = await OrderPaymentProof.findByOrFail('orderId', rejected.id)
    assert.equal(proof.rejectionReason, 'Not received')
    assert.equal(proof.reviewedByUserId, user.id)
    assert.isTrue(proof.isRejected)
  })

  test('review fails when nothing is waiting for review', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { order } = await placedOrder()

    const field = await fieldOf(service.review(order, user.id, { decision: 'approve' }))

    assert.isDefined(field)
    assert.equal((await Order.findOrFail(order.id)).paymentStatus, 'pending')
  })

  test('image is null when the proof has no screenshot', async ({ assert }) => {
    const service = await app.container.make(OrderPaymentProofService)
    const { order } = await placedOrder()
    await service.submit(order, { image: null, details: 'Paid' })

    assert.isNull(await service.image(order.id))
  })
})

test.group('OrderNoteService.replyByCustomer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('replies only to top-level staff notes the customer can see', async ({ assert }) => {
    const service = await app.container.make(OrderNoteService)
    const user = await createAdminUser('admin')
    const { customer, order } = await placedOrder()
    const visible = await OrderNote.create({
      orderId: order.id,
      userId: user.id,
      visibility: 'customer',
      body: 'Shipping tomorrow',
    })
    const internal = await OrderNote.create({
      orderId: order.id,
      userId: user.id,
      visibility: 'internal',
      body: 'Check stock',
    })

    const reply = await service.replyByCustomer(order, customer.id, visible.id, 'Thanks')
    assert.equal(reply.parentId, visible.id)
    assert.isTrue(reply.isFromCustomer)

    assert.equal(
      await fieldOf(service.replyByCustomer(order, customer.id, internal.id, 'Hi')),
      'parentId'
    )
    assert.equal(
      await fieldOf(service.replyByCustomer(order, customer.id, reply.id, 'Again')),
      'parentId'
    )
  })
})
