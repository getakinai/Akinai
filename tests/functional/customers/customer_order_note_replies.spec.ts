import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import AuditLog from '#models/audit_log'
import type CustomerAccount from '#models/customer_account'
import type Order from '#models/order'
import OrderNote from '#models/order_note'
import type { OrderNoteVisibility } from '#constants/order_notes'
import StaffOrderNoteRepliedMail from '#mails/staff_order_note_replied_mail'
import StoreSettingService from '#services/store_setting_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

async function staffNote(order: Order, visibility: OrderNoteVisibility = 'customer') {
  const user = await createAdminUser('admin')
  return OrderNote.create({
    orderId: order.id,
    userId: user.id,
    visibility,
    body: 'Your parcel ships tomorrow.',
  })
}

function reply(
  client: ApiClient,
  account: CustomerAccount,
  orderId: string,
  body: Record<string, unknown>
) {
  return client
    .post(`/account/orders/${orderId}/notes`)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

test.group('Customer order notes: reply', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('owner replies to a note they can see', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const settings = await (await app.container.make(StoreSettingService)).get()
    settings.orderNotificationEmails = ['staff@example.com']
    await settings.save()

    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)

    const response = await reply(client, account, order.id, {
      parentId: note.id,
      body: '  Thanks, can you leave it at the door?  ',
    })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.body, 'Thanks, can you leave it at the door?')
    assert.isTrue(data.fromCustomer)

    const saved = await OrderNote.findOrFail(data.id)
    assert.equal(saved.parentId, note.id)
    assert.equal(saved.customerId, customer.id)
    assert.isNull(saved.userId)
    assert.equal(saved.visibility, 'customer')

    mails.assertQueued(StaffOrderNoteRepliedMail)
    const [log] = await AuditLog.query()
      .where('auditable_id', order.id)
      .where('action', 'note_added')
    assert.exists(log)
  })

  test('the reply is nested under its note for the customer and staff', async ({
    client,
    assert,
  }) => {
    const { account, customer } = await createCustomerAccount({ fullName: 'Ana Cruz' })
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)
    ;(await reply(client, account, order.id, { parentId: note.id, body: 'Thanks!' })).assertStatus(
      200
    )

    const customerList = await client
      .get(`/account/orders/${order.id}/notes/list`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)
    customerList.assertStatus(200)
    const customerNotes = customerList.body().data
    assert.lengthOf(customerNotes, 1)
    assert.equal(customerNotes[0].id, note.id)
    assert.isFalse(customerNotes[0].fromCustomer)
    assert.lengthOf(customerNotes[0].replies, 1)
    assert.equal(customerNotes[0].replies[0].body, 'Thanks!')
    assert.isTrue(customerNotes[0].replies[0].fromCustomer)

    const staff = await createAdminUser(['orders.view'])
    const staffList = await client
      .get(`/admin/orders/${order.id}/notes/list`)
      .accept('json')
      .withGuard('web')
      .loginAs(staff)
    staffList.assertStatus(200)
    const staffNotes = staffList.body().data
    assert.lengthOf(staffNotes, 1)
    assert.lengthOf(staffNotes[0].replies, 1)
    assert.equal(staffNotes[0].replies[0].author, 'Ana Cruz')
  })

  test('ignores an owner id sent in the body', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)

    const response = await reply(client, account, order.id, {
      parentId: note.id,
      body: 'Hello',
      customerId: other.id,
    })

    response.assertStatus(200)
    const saved = await OrderNote.findOrFail(response.body().data.id)
    assert.equal(saved.customerId, customer.id)
  })

  test('cannot reply to an internal note', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order, 'internal')

    const response = await reply(client, account, order.id, { parentId: note.id, body: 'Hi' })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'parentId')
    assert.lengthOf(await OrderNote.query().where('parent_id', note.id), 0)
  })

  test('cannot reply to a note on another of their orders', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const otherOrder = await createPlacedOrder(customer)
    const note = await staffNote(otherOrder)

    const response = await reply(client, account, order.id, { parentId: note.id, body: 'Hi' })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'parentId')
  })

  test('cannot reply to a reply', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)
    const first = await reply(client, account, order.id, { parentId: note.id, body: 'Hi' })
    first.assertStatus(200)

    const response = await reply(client, account, order.id, {
      parentId: first.body().data.id,
      body: 'Again',
    })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'parentId')
  })

  test('validates the body and parent id', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)

    ;(await reply(client, account, order.id, { parentId: note.id, body: '   ' })).assertStatus(422)
    ;(
      await reply(client, account, order.id, { parentId: note.id, body: 'x'.repeat(2001) })
    ).assertStatus(422)
    ;(await reply(client, account, order.id, { parentId: 'nope', body: 'Hi' })).assertStatus(422)
    ;(await reply(client, account, order.id, { body: 'Hi' })).assertStatus(422)
    ;(await reply(client, account, order.id, { parentId: note.id, body: 42 })).assertStatus(422)
  })

  test('another customer gets 404', async ({ client, assert }) => {
    const { customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)

    const response = await reply(client, other, order.id, { parentId: note.id, body: 'Hi' })

    response.assertStatus(404)
    assert.lengthOf(await OrderNote.query().where('parent_id', note.id), 0)
  })

  test('guests get 401', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const note = await staffNote(order)

    const response = await client
      .post(`/account/orders/${order.id}/notes`)
      .json({ parentId: note.id, body: 'Hi' })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})
