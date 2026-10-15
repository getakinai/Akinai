import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import mail from '@adonisjs/mail/services/main'
import sharp from 'sharp'
import AuditLog from '#models/audit_log'
import type CustomerAccount from '#models/customer_account'
import Order from '#models/order'
import OrderPaymentProof from '#models/order_payment_proof'
import StaffPaymentSubmittedMail from '#mails/staff_payment_submitted_mail'
import StoreSettingService from '#services/store_setting_service'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

async function pngBuffer() {
  return sharp({ create: { width: 8, height: 4, channels: 3, background: '#14532d' } })
    .png()
    .toBuffer()
}

async function setStaffRecipients(emails: string[]) {
  const settings = await (await app.container.make(StoreSettingService)).get()
  settings.orderNotificationEmails = emails
  await settings.save()
}

function submit(
  client: ApiClient,
  account: CustomerAccount,
  orderId: string,
  { image, details }: { image?: Buffer; details?: string } = {}
) {
  let request = client.post(`/account/orders/${orderId}/payment-proof`)
  if (image) request = request.file('image', image, { filename: 'transfer.png' })
  if (details !== undefined) request = request.field('details', details)
  return request.accept('json').withCsrfToken().withGuard('customer').loginAs(account)
}

test.group('Customer order payment proof: submit', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fsPrivate')
    return () => drive.restore('fsPrivate')
  })

  test('owner submits a screenshot and the order moves to payment_submitted', async ({
    client,
    assert,
  }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, account, order.id, { image: await pngBuffer() })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.paymentStatus, 'payment_submitted')
    assert.isTrue(data.paymentProof.hasImage)
    assert.isNull(data.paymentProof.details)
    assert.isNull(data.paymentProof.rejectionReason)
    assert.notProperty(data.paymentProof, 'imageKey')

    await order.refresh()
    assert.equal(order.paymentStatus, 'payment_submitted')
    const proof = await OrderPaymentProof.findByOrFail('orderId', order.id)
    assert.isTrue(proof.imageKey!.startsWith('private/payment-proofs/'))
    assert.isTrue(await drive.use('fsPrivate').exists(proof.imageKey!))
  })

  test('owner submits details only', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, account, order.id, {
      details: '  Paid from ANZ, ref 1234  ',
    })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.paymentStatus, 'payment_submitted')
    assert.isFalse(data.paymentProof.hasImage)
    assert.equal(data.paymentProof.details, 'Paid from ANZ, ref 1234')
  })

  test('records an audit event and alerts staff', async ({ client, assert }) => {
    const { mails } = mail.fake()
    await setStaffRecipients(['staff@example.com'])
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, account, order.id, {
      image: await pngBuffer(),
      details: 'Paid on Friday',
    })

    response.assertStatus(200)
    mails.assertQueued(StaffPaymentSubmittedMail)
    const [log] = await AuditLog.query()
      .where('auditable_id', order.id)
      .where('action', 'payment_submitted')
    assert.exists(log)
  })

  test('rejects an empty submission', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, account, order.id, { details: '   ' })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'details')
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('rejects details longer than the limit', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, account, order.id, { details: 'x'.repeat(1001) })

    response.assertStatus(422)
  })

  test('rejects files that are not images', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await client
      .post(`/account/orders/${order.id}/payment-proof`)
      .file('image', Buffer.from('<svg></svg>'), { filename: 'transfer.svg' })
      .accept('json')
      .withCsrfToken()
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(422)
    assert.isNull(await OrderPaymentProof.findBy('orderId', order.id))
  })

  test('rejects orders not paid by bank transfer', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { paymentMethod: 'stripe' })

    const response = await submit(client, account, order.id, { details: 'Paid' })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'order')
  })

  test('rejects orders that are already paid', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    order.paymentStatus = 'paid'
    await order.save()

    const response = await submit(client, account, order.id, { details: 'Paid' })

    response.assertStatus(422)
  })

  test('rejects cancelled orders', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { status: 'cancelled' })

    const response = await submit(client, account, order.id, { details: 'Paid' })

    response.assertStatus(422)
  })

  test('replacing a submission removes the old screenshot and clears a rejection', async ({
    client,
    assert,
  }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    ;(await submit(client, account, order.id, { image: await pngBuffer() })).assertStatus(200)
    const first = await OrderPaymentProof.findByOrFail('orderId', order.id)
    const firstKey = first.imageKey!

    first.rejectionReason = 'Amount does not match'
    await first.save()
    await Order.query().where('id', order.id).update({ paymentStatus: 'pending' })

    const response = await submit(client, account, order.id, {
      image: await pngBuffer(),
      details: 'Sent the rest',
    })

    response.assertStatus(200)
    assert.equal(response.body().data.paymentStatus, 'payment_submitted')
    assert.isNull(response.body().data.paymentProof.rejectionReason)
    assert.lengthOf(await OrderPaymentProof.query().where('order_id', order.id), 1)
    const second = await OrderPaymentProof.findByOrFail('orderId', order.id)
    assert.notEqual(second.imageKey, firstKey)
    assert.equal(second.details, 'Sent the rest')
    assert.isFalse(await drive.use('fsPrivate').exists(firstKey))
    assert.isTrue(await drive.use('fsPrivate').exists(second.imageKey!))
  })

  test('replacing with details only drops the old screenshot', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    ;(await submit(client, account, order.id, { image: await pngBuffer() })).assertStatus(200)
    const firstKey = (await OrderPaymentProof.findByOrFail('orderId', order.id)).imageKey!

    const response = await submit(client, account, order.id, { details: 'Ref 99' })

    response.assertStatus(200)
    assert.isFalse(response.body().data.paymentProof.hasImage)
    assert.isFalse(await drive.use('fsPrivate').exists(firstKey))
  })

  test('another customer gets 404', async ({ client, assert }) => {
    const { customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await submit(client, other, order.id, { details: 'Paid' })

    response.assertStatus(404)
    assert.isNull(await OrderPaymentProof.findBy('orderId', order.id))
  })

  test('guests get 401', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await client
      .post(`/account/orders/${order.id}/payment-proof`)
      .field('details', 'Paid')
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})

test.group('Customer order payment proof: image', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fsPrivate')
    return () => drive.restore('fsPrivate')
  })

  test('owner can view the screenshot privately', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    ;(await submit(client, account, order.id, { image: await pngBuffer() })).assertStatus(200)

    const response = await client
      .get(`/account/orders/${order.id}/payment-proof/image`)
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'image/png')
    assert.equal(response.header('cache-control'), 'private, no-store')
  })

  test('returns 404 when there is no screenshot', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    ;(await submit(client, account, order.id, { details: 'Paid' })).assertStatus(200)

    const response = await client
      .get(`/account/orders/${order.id}/payment-proof/image`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(404)
  })

  test('another customer gets 404', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    ;(await submit(client, account, order.id, { image: await pngBuffer() })).assertStatus(200)

    const response = await client
      .get(`/account/orders/${order.id}/payment-proof/image`)
      .accept('json')
      .withGuard('customer')
      .loginAs(other)

    response.assertStatus(404)
  })

  test('guests get 401', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await client
      .get(`/account/orders/${order.id}/payment-proof/image`)
      .accept('json')

    response.assertStatus(401)
  })
})
