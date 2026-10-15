import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import mail from '@adonisjs/mail/services/main'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'
import Order from '#models/order'
import OrderPaymentProof from '#models/order_payment_proof'
import type User from '#models/user'
import OrderPaymentReceivedMail from '#mails/order_payment_received_mail'
import OrderPaymentRejectedMail from '#mails/order_payment_rejected_mail'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

async function pngBuffer() {
  return sharp({ create: { width: 8, height: 4, channels: 3, background: '#14532d' } })
    .png()
    .toBuffer()
}

/** A bank transfer order whose customer has sent a proof (with a screenshot). */
async function submittedOrder({ withImage = true } = {}) {
  const { account, customer } = await createCustomerAccount()
  const order = await createPlacedOrder(customer)
  let imageKey: string | null = null
  if (withImage) {
    imageKey = `payment-proofs/${order.id}.png`
    await drive.use('fsPrivate').put(imageKey, await pngBuffer())
  }
  await OrderPaymentProof.create({
    orderId: order.id,
    imageKey,
    details: 'Paid from ANZ',
    submittedAt: DateTime.now(),
  })
  await Order.query().where('id', order.id).update({ paymentStatus: 'payment_submitted' })
  await order.refresh()
  return { account, customer, order }
}

function review(client: ApiClient, user: User, orderId: string, body: Record<string, unknown>) {
  return client
    .put(`/admin/orders/${orderId}/payment-proof/review`)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

test.group('Staff order payment proof: review', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fsPrivate')
    return () => drive.restore('fsPrivate')
  })

  test('approving marks the order paid and emails the customer', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { order } = await submittedOrder()

    const response = await review(client, user, order.id, { decision: 'approve' })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.paymentStatus, 'paid')
    assert.isString(data.paymentProof.reviewedAt)
    assert.isNull(data.paymentProof.rejectionReason)

    await order.refresh()
    assert.equal(order.paymentStatus, 'paid')
    const proof = await OrderPaymentProof.findByOrFail('orderId', order.id)
    assert.equal(proof.reviewedByUserId, user.id)
    mails.assertQueued(OrderPaymentReceivedMail)
    const [log] = await AuditLog.query().where('auditable_id', order.id).where('action', 'paid')
    assert.exists(log)
  })

  test('rejecting sets the order back to pending with the reason', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { account, order } = await submittedOrder()

    const response = await review(client, user, order.id, {
      decision: 'reject',
      reason: '  Amount does not match  ',
    })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.paymentStatus, 'pending')
    assert.equal(data.paymentProof.rejectionReason, 'Amount does not match')
    mails.assertQueued(OrderPaymentRejectedMail)

    const customerView = await client
      .get(`/account/orders/view/${order.id}`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)
    customerView.assertStatus(200)
    assert.equal(customerView.body().data.paymentStatus, 'pending')
    assert.equal(customerView.body().data.paymentProof.rejectionReason, 'Amount does not match')
  })

  test('rejecting requires a reason', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { order } = await submittedOrder()

    const missing = await review(client, user, order.id, { decision: 'reject' })
    missing.assertStatus(422)

    const blank = await review(client, user, order.id, { decision: 'reject', reason: '   ' })
    blank.assertStatus(422)

    const tooLong = await review(client, user, order.id, {
      decision: 'reject',
      reason: 'x'.repeat(501),
    })
    tooLong.assertStatus(422)

    await order.refresh()
    assert.equal(order.paymentStatus, 'payment_submitted')
  })

  test('rejects an unknown decision', async ({ client }) => {
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { order } = await submittedOrder()

    const response = await review(client, user, order.id, { decision: 'maybe' })

    response.assertStatus(422)
  })

  test('returns 422 when no proof is waiting for review', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await review(client, user, order.id, { decision: 'approve' })

    response.assertStatus(422)
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('cannot review the same proof twice', async ({ client }) => {
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const { order } = await submittedOrder()

    ;(await review(client, user, order.id, { decision: 'approve' })).assertStatus(200)
    const again = await review(client, user, order.id, { decision: 'reject', reason: 'Oops' })

    again.assertStatus(422)
  })

  test('forbids reviewing without orders.edit', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])
    const { order } = await submittedOrder()

    const response = await review(client, user, order.id, { decision: 'approve' })

    response.assertStatus(403)
    await order.refresh()
    assert.equal(order.paymentStatus, 'payment_submitted')
  })

  test('customers cannot reach the review endpoint', async ({ client }) => {
    const { account, order } = await submittedOrder()

    const response = await client
      .put(`/admin/orders/${order.id}/payment-proof/review`)
      .json({ decision: 'approve' })
      .accept('json')
      .withCsrfToken()
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(401)
  })
})

test.group('Staff order payment proof: image', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fsPrivate')
    return () => drive.restore('fsPrivate')
  })

  test('staff with orders.view can view the screenshot', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])
    const { order } = await submittedOrder()

    const response = await client
      .get(`/admin/orders/${order.id}/payment-proof/image`)
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'image/png')
    assert.equal(response.header('cache-control'), 'private, no-store')
  })

  test('returns 404 when the proof has no screenshot', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const { order } = await submittedOrder({ withImage: false })

    const response = await client
      .get(`/admin/orders/${order.id}/payment-proof/image`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('forbids staff without orders.view', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const { order } = await submittedOrder()

    const response = await client
      .get(`/admin/orders/${order.id}/payment-proof/image`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})
