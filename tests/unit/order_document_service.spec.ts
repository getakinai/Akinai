import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import {
  documentFilename,
  invoiceData,
  packingSlipData,
  receiptData,
} from '#documents/order_document_data'
import OrderConfirmationMail from '#mails/order_confirmation_mail'
import OrderPaymentReceivedMail from '#mails/order_payment_received_mail'
import Order from '#models/order'
import type { BankTransferConfig } from '#models/payment_method'
import Refund from '#models/refund'
import OrderLineItem from '#models/order_line_item'
import OrderRepository from '#repositories/order_repository'
import OrderDocumentService from '#services/order_document_service'
import OrderNotificationService from '#services/order_notification_service'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import OrderService from '#services/order_service'
import StoreSettingService from '#services/store_setting_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

const BANK: BankTransferConfig = {
  countryCode: 'NZ',
  accountName: 'Akinai Ltd',
  bankName: 'ANZ',
  accountNumber: '01-0123-0123456-00',
  bsb: null,
  instructions: null,
}

async function placedOrder(options: Parameters<typeof createPlacedOrder>[1] = {}) {
  const { customer } = await createCustomerAccount()
  const order = await createPlacedOrder(customer, options)
  await order.load('lineItems')
  return order
}

async function settings() {
  return (await app.container.make(StoreSettingService)).get()
}

function meta(rows: { label: string; value: string }[], label: string) {
  return rows.find((row) => row.label === label)?.value ?? ''
}

test.group('Order document data', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('invoice shows the order, totals and both addresses', async ({ assert }) => {
    const order = await placedOrder()
    order.shippingAddress = {
      fullName: 'Jane Buyer',
      company: null,
      address1: '1 George Street',
      address2: null,
      city: 'Sydney',
      province: 'NSW',
      postalCode: '2000',
      countryCode: 'AU',
      phone: null,
    }

    const data = invoiceData(order, await settings())

    assert.equal(data.kind, 'invoice')
    assert.equal(data.title, 'Invoice')
    assert.isNull(data.stamp)
    assert.equal(meta(data.meta, 'Invoice'), `INV-${order.orderNumber}`)
    assert.equal(meta(data.meta, 'Order'), `#${order.orderNumber}`)
    assert.include(meta(data.meta, 'Payment'), 'Bank transfer')
    assert.deepEqual(
      data.parties.map((party) => party.heading),
      ['Bill to', 'Ship to']
    )
    assert.include(data.parties[1].lines, '1 George Street')
    assert.isTrue(data.showPrices)
    assert.lengthOf(data.lines, 1)
    assert.equal(data.lines[0].title, 'Mug')
    assert.isString(data.lines[0].amount)
    assert.equal(data.totals.at(-1)?.label, 'Total')
  })

  test('unpaid bank transfer invoices say how to pay', async ({ assert }) => {
    const order = await placedOrder()

    const data = invoiceData(order, await settings(), BANK)

    const section = data.sections.find((item) => item.heading === 'How to pay')
    assert.exists(section)
    assert.equal(meta(section!.rows, 'Account number'), BANK.accountNumber)
    assert.equal(meta(section!.rows, 'Reference'), order.bankReference!)
  })

  test('paid and cancelled invoices are stamped and drop the payment details', async ({
    assert,
  }) => {
    const paid = await placedOrder()
    paid.paymentStatus = 'paid'
    const cancelled = await placedOrder({ status: 'cancelled' })
    const store = await settings()

    const paidData = invoiceData(paid, store, BANK)
    const cancelledData = invoiceData(cancelled, store, BANK)

    assert.equal(paidData.stamp, 'Paid')
    assert.lengthOf(paidData.sections, 0)
    assert.equal(cancelledData.stamp, 'Cancelled')
    assert.lengthOf(cancelledData.sections, 0)
  })

  test('card orders never show bank details', async ({ assert }) => {
    const order = await placedOrder({ paymentMethod: 'stripe' })

    const data = invoiceData(order, await settings(), BANK)

    assert.lengthOf(data.sections, 0)
    assert.include(meta(data.meta, 'Payment'), 'Card')
  })

  test('receipt shows the payment date and only refunds that went through', async ({ assert }) => {
    const order = await placedOrder()
    const paidAt = DateTime.fromISO('2026-03-04T10:00:00Z')
    order.merge({ paymentStatus: 'partially_refunded', paidAt, refundedTotal: 10 })
    order.$setRelated('refunds', [
      new Refund().merge({ amount: 10, status: 'succeeded', createdAt: DateTime.now() }),
      new Refund().merge({ amount: 5, status: 'failed', createdAt: DateTime.now() }),
    ])
    const store = await settings()

    const data = receiptData(order, store)

    assert.equal(data.kind, 'receipt')
    assert.equal(data.stamp, 'Partially refunded')
    assert.equal(meta(data.meta, 'Receipt'), `RCT-${order.orderNumber}`)
    assert.isNotEmpty(meta(data.meta, 'Paid on'))
    assert.deepEqual(
      data.parties.map((party) => party.heading),
      ['Bill to']
    )
    const payment = data.sections.find((item) => item.heading === 'Payment')
    assert.equal(meta(payment!.rows, 'Reference'), order.bankReference!)
    const refunds = data.sections.find((item) => item.heading === 'Refunds')
    assert.lengthOf(refunds!.rows, 1)
    assert.isTrue(refunds!.rows[0].value.startsWith('−'))
    assert.include(
      data.totals.map((total) => total.label),
      'Net'
    )
  })

  test('packing slip lists units still to ship, without prices', async ({ assert }) => {
    const order = await placedOrder({ quantity: 3 })
    const removed = new OrderLineItem().merge({
      productTitle: 'Plate',
      variantTitle: 'Blue',
      sku: 'PLATE-BLUE',
      unitPrice: 5,
      quantity: 2,
      removedQuantity: 2,
      lineTotal: 10,
    })
    const partly = new OrderLineItem().merge({
      productTitle: 'Bowl',
      variantTitle: 'Default Title',
      sku: 'BOWL',
      unitPrice: 5,
      quantity: 4,
      removedQuantity: 1,
      lineTotal: 20,
    })
    order.$setRelated('lineItems', [...order.lineItems, removed, partly])

    const data = packingSlipData(order, await settings())

    assert.equal(data.kind, 'packing_slip')
    assert.isFalse(data.showPrices)
    assert.lengthOf(data.totals, 0)
    assert.deepEqual(
      data.parties.map((party) => party.heading),
      ['Ship to']
    )
    assert.deepEqual(
      data.lines.map((line) => [line.title, line.quantity]),
      [
        ['Mug', 3],
        ['Bowl', 3],
      ]
    )
    assert.equal(data.lines[1].detail, 'SKU BOWL')
    assert.isTrue(data.lines.every((line) => line.amount === null && line.unitPrice === null))
    assert.equal(meta(data.meta, 'Shipping'), 'Standard')
  })

  test('filenames use the order number', async ({ assert }) => {
    const order = await placedOrder()

    assert.equal(documentFilename('invoice', order), `invoice-${order.orderNumber}.pdf`)
    assert.equal(documentFilename('receipt', order), `receipt-${order.orderNumber}.pdf`)
    assert.equal(documentFilename('packing_slip', order), `packing-slip-${order.orderNumber}.pdf`)
  })
})

test.group('OrderDocumentService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('drafts have no documents and receipts need a paid order', async ({ assert }) => {
    const service = await app.container.make(OrderDocumentService)
    const order = await placedOrder()
    const draft = await placedOrder({ status: 'draft' })

    assert.isTrue(service.isAvailable('invoice', order))
    assert.isTrue(service.isAvailable('packing_slip', order))
    assert.isFalse(service.isAvailable('receipt', order))
    assert.isFalse(service.isAvailable('invoice', draft))

    order.paymentStatus = 'refunded'
    assert.isTrue(service.isAvailable('receipt', order))
  })

  test('render returns a PDF, or null when unavailable', async ({ assert }) => {
    const service = await app.container.make(OrderDocumentService)
    const order = await placedOrder()

    const invoice = await service.render('invoice', order)
    const receipt = await service.render('receipt', order)

    assert.equal(invoice!.filename, `invoice-${order.orderNumber}.pdf`)
    assert.equal(invoice!.buffer.subarray(0, 5).toString(), '%PDF-')
    assert.isNull(receipt)
  })

  test('render handles orders long enough to need several pages', async ({ assert }) => {
    const service = await app.container.make(OrderDocumentService)
    const order = await placedOrder()
    const lines = Array.from({ length: 60 }, (_, index) =>
      new OrderLineItem().merge({
        productTitle: `A product with a fairly long title number ${index}`,
        variantTitle: null,
        sku: `SKU-${index}`,
        unitPrice: 1,
        quantity: 1,
        removedQuantity: 0,
        lineTotal: 1,
      })
    )
    order.$setRelated('lineItems', lines)

    const slip = await service.render('packing_slip', order)

    assert.isAbove(slip!.buffer.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0, 1)
  })

  test('emailAttachments skips unavailable documents', async ({ assert }) => {
    const service = await app.container.make(OrderDocumentService)
    const order = await placedOrder()

    const attachments = await service.emailAttachments(
      order,
      ['invoice', 'receipt'],
      await settings()
    )

    assert.deepEqual(
      attachments.map((attachment) => attachment.filename),
      [`invoice-${order.orderNumber}.pdf`]
    )
    assert.equal(
      Buffer.from(attachments[0].contentBase64, 'base64').subarray(0, 5).toString(),
      '%PDF-'
    )
  })

  test('emailAttachments leaves out documents that fail to render', async ({ assert }) => {
    const service = await app.container.make(OrderDocumentService)
    const order = await placedOrder()
    service.render = async () => {
      throw new Error('font missing')
    }

    const attachments = await service.emailAttachments(order, ['invoice'], await settings())

    assert.deepEqual(attachments, [])
  })
})

/**
 * Attachments added with `attachData()`. The mail package's `hasAttachment`
 * only searches ones added with `attach(path)`.
 */
function attachmentsOf(sent: { message: { toObject(): { message: { attachments?: unknown } } } }) {
  const { attachments } = sent.message.toObject().message
  return (attachments ?? []) as { filename?: string; contentType?: string }[]
}

test.group('Order email attachments', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('the confirmation of an unpaid order attaches the invoice only', async ({ assert }) => {
    const { mails } = mail.fake()
    const notifications = await app.container.make(OrderNotificationService)
    const order = await placedOrder()

    await notifications.orderPlaced(order.id, { notifyStaff: false })

    const [sent] = mails.queued((queued) => queued instanceof OrderConfirmationMail)
    assert.exists(sent)
    assert.deepEqual(
      attachmentsOf(sent).map((attachment) => attachment.filename),
      [`invoice-${order.orderNumber}.pdf`]
    )
  })

  test('the confirmation of a paid order attaches the invoice and receipt', async ({ assert }) => {
    const { mails } = mail.fake()
    const notifications = await app.container.make(OrderNotificationService)
    const order = await placedOrder({ paymentMethod: 'stripe' })
    await order.merge({ paymentStatus: 'paid', paidAt: DateTime.now() }).save()

    await notifications.orderPlaced(order.id, { notifyStaff: false })

    const [sent] = mails.queued((queued) => queued instanceof OrderConfirmationMail)
    assert.sameMembers(
      attachmentsOf(sent).map((attachment) => attachment.filename),
      [`invoice-${order.orderNumber}.pdf`, `receipt-${order.orderNumber}.pdf`]
    )
  })

  test('the payment received email attaches the receipt', async ({ assert }) => {
    const { mails } = mail.fake()
    const notifications = await app.container.make(OrderNotificationService)
    const order = await placedOrder()
    await order.merge({ paymentStatus: 'paid', paidAt: DateTime.now() }).save()

    await notifications.paymentReceived(order.id)

    const [sent] = mails.queued((queued) => queued instanceof OrderPaymentReceivedMail)
    assert.exists(sent)
    const [receipt] = attachmentsOf(sent)
    assert.equal(receipt?.filename, `receipt-${order.orderNumber}.pdf`)
    assert.equal(receipt?.contentType, 'application/pdf')
  })
})

test.group('Order payment date', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('markPaid records when the payment arrived', async ({ assert }) => {
    const repository = await app.container.make(OrderRepository)
    const order = await placedOrder({ paymentMethod: 'stripe' })

    assert.isTrue(await repository.markPaid(order.id, 'cs_test_123'))

    const fresh = await Order.findOrFail(order.id)
    assert.equal(fresh.paymentStatus, 'paid')
    assert.isTrue(fresh.paidAt?.isValid)
  })

  test('approving payment proof records the payment date', async ({ assert }) => {
    mail.fake()
    const service = await app.container.make(OrderPaymentProofService)
    const user = await createAdminUser(['orders.view', 'orders.edit'])
    const order = await placedOrder()

    await service.submit(order, { image: null, details: 'Paid' })
    assert.isNull((await Order.findOrFail(order.id)).paidAt)
    await service.review(order, user.id, { decision: 'approve' })

    assert.isTrue((await Order.findOrFail(order.id)).paidAt?.isValid)
  })

  test('backfill sets paid_at from completed_at on paid orders only, once', async ({ assert }) => {
    const orderService = await app.container.make(OrderService)
    const paid = await placedOrder({ placedMinutesAgo: 90 })
    await Order.query().where('id', paid.id).update({ payment_status: 'paid', paid_at: null })
    const pending = await placedOrder()
    const alreadySet = await placedOrder()
    const setAt = DateTime.fromISO('2026-01-02T03:04:05Z')
    await alreadySet.merge({ paymentStatus: 'paid', paidAt: setAt }).save()

    assert.isAtLeast(await orderService.backfillPaidAt(), 1)

    const freshPaid = await Order.findOrFail(paid.id)
    assert.equal(freshPaid.paidAt?.toMillis(), freshPaid.completedAt?.toMillis())
    assert.isNull((await Order.findOrFail(pending.id)).paidAt)
    assert.equal((await Order.findOrFail(alreadySet.id)).paidAt?.toMillis(), setAt.toMillis())
    assert.equal(await orderService.backfillPaidAt(), 0)
  })
})
