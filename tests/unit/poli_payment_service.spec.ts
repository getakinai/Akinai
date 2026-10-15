import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { appUrl } from '#config/app'
import Order from '#models/order'
import Refund from '#models/refund'
import PoliPaymentService from '#services/poli_payment_service'
import { createPlacedOrder } from '#tests/helpers/customers'
import { seedOrderSetup } from '#tests/helpers/orders'
import {
  POLI_NAVIGATE_URL,
  POLI_TOKEN,
  fakePoliGateway,
  type FakePoliGateway,
} from '#tests/helpers/poli'

let gateway: FakePoliGateway

async function poliOrder(customer: Parameters<typeof createPlacedOrder>[0]) {
  const order = await createPlacedOrder(customer, { paymentMethod: 'poli' })
  await order.merge({ paymentReference: POLI_TOKEN }).save()
  return order
}

test.group('PoliPaymentService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const fake = fakePoliGateway()
    gateway = fake.gateway
    return fake.restore
  })
  group.each.timeout(20_000)

  test('start opens POLi with return URLs built from APP_URL', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await createPlacedOrder(customer, { paymentMethod: 'poli' })
    const service = await app.container.make(PoliPaymentService)

    const redirectTo = await service.start(order)

    const origin = new URL(appUrl).origin
    assert.equal(redirectTo, POLI_NAVIGATE_URL)
    assert.deepEqual(gateway.initiated[0].urls, {
      homepageUrl: origin,
      successUrl: `${origin}/checkout/orders/${order.id}/poli-return?status=success`,
      failureUrl: `${origin}/checkout/orders/${order.id}/poli-return?status=failure`,
      cancellationUrl: `${origin}/checkout/orders/${order.id}/poli-return?status=cancelled`,
      notificationUrl: `${origin}/poli/nudge`,
    })
    await order.refresh()
    assert.equal(order.paymentReference, POLI_TOKEN)
  })

  test('confirm marks a paid order paid once', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    gateway.paid(order)
    const service = await app.container.make(PoliPaymentService)

    assert.isTrue(await service.confirm(order, null))
    assert.isFalse(await service.confirm(await Order.findOrFail(order.id), POLI_TOKEN))

    await order.refresh()
    assert.equal(order.paymentStatus, 'paid')
    assert.isNotNull(order.paidAt)
    assert.deepEqual(gateway.lookups, [POLI_TOKEN, POLI_TOKEN])
  })

  test('confirm rejects a payment for a different amount', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    gateway.paid(order, { amountPaid: Math.round(order.total * 100) - 1 })
    const service = await app.container.make(PoliPaymentService)

    assert.isFalse(await service.confirm(order, null))
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('confirm rejects a payment in a different currency', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    gateway.paid(order, { currency: 'NZD' })
    const service = await app.container.make(PoliPaymentService)

    assert.isFalse(await service.confirm(order, null))
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('confirm rejects a transaction for another order', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    const other = await poliOrder(customer)
    gateway.paid(other)
    const service = await app.container.make(PoliPaymentService)

    assert.isFalse(await service.confirm(order, null))
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('an unfinished or unverified transaction stays unpaid', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    const service = await app.container.make(PoliPaymentService)

    gateway.paid(order, { status: 'ReceiptUnverified', paid: false })
    assert.isFalse(await service.confirm(order, null))
    gateway.paid(order, { status: 'Initiated', paid: false })
    assert.isFalse(await service.confirm(order, null))

    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('confirm ignores orders not paid with POLi', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await createPlacedOrder(customer, { paymentMethod: 'stripe' })
    gateway.paid(order)
    const service = await app.container.make(PoliPaymentService)

    assert.isFalse(await service.confirm(order, POLI_TOKEN))
    assert.lengthOf(gateway.lookups, 0)
  })

  test('a nudge marks the order paid', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    gateway.paid(order)
    const service = await app.container.make(PoliPaymentService)

    await service.handleNudge(POLI_TOKEN)
    await service.handleNudge(POLI_TOKEN)

    await order.refresh()
    assert.equal(order.paymentStatus, 'paid')
  })

  test('a nudge for an unknown order is ignored', async ({ assert }) => {
    await seedOrderSetup()
    gateway.transactions.set(POLI_TOKEN, {
      status: 'Completed',
      paid: true,
      merchantReference: '0190f5a0-0000-7000-8000-000000000999',
      amountPaid: 5000,
      currency: 'AUD',
    })
    const service = await app.container.make(PoliPaymentService)

    await service.handleNudge(POLI_TOKEN)

    gateway.transactions.set(POLI_TOKEN, {
      status: 'Completed',
      paid: true,
      merchantReference: 'not-a-uuid',
      amountPaid: 5000,
      currency: 'AUD',
    })
    await service.handleNudge(POLI_TOKEN)
    assert.lengthOf(gateway.lookups, 2)
  })

  test('a nudge for a forged token fails without paying anything', async ({ assert }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    const service = await app.container.make(PoliPaymentService)

    await assert.rejects(() => service.handleNudge('ForgedToken'))
    await order.refresh()
    assert.equal(order.paymentStatus, 'pending')
  })

  test('a payment after cancellation is recorded but not refunded automatically', async ({
    assert,
  }) => {
    const { customer } = await seedOrderSetup()
    const order = await poliOrder(customer)
    await order.merge({ status: 'cancelled', paymentStatus: 'voided' }).save()
    gateway.paid(order)
    const service = await app.container.make(PoliPaymentService)

    await service.handleNudge(POLI_TOKEN)

    await order.refresh()
    assert.equal(order.paymentStatus, 'paid')
    assert.lengthOf(await Refund.query().where('order_id', order.id), 0)
  })
})
