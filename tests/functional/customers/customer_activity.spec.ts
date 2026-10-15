import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditLog from '#models/audit_log'
import type CustomerAccount from '#models/customer_account'
import { auditActor } from '#services/audit_actor'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createCustomerAddress } from '#tests/helpers/customers'

type Body = Record<string, unknown>

function listActivity(client: any, account: CustomerAccount, qs: Body = {}) {
  return client
    .get('/account/activity/list')
    .qs(qs)
    .accept('json')
    .withGuard('customer')
    .loginAs(account)
}

function send(
  client: any,
  method: 'put' | 'delete',
  account: CustomerAccount,
  url: string,
  body: Body = {}
) {
  return client[method](url)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

const ADDRESS_BODY = {
  fullName: 'Jane Buyer',
  company: null,
  address1: '1 George Street',
  address2: null,
  city: 'Sydney',
  province: 'NSW',
  postalCode: '2000',
  countryCode: 'AU',
  phone: null,
  isDefault: false,
}

test.group('Customer account: activity', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('logs an address update with only the changed fields and no ids', async ({
    client,
    assert,
  }) => {
    const { account, customer } = await createCustomerAccount()
    const address = await createCustomerAddress(customer)

    await send(client, 'put', account, `/account/addresses/${address.id}`, {
      ...ADDRESS_BODY,
      city: 'Melbourne',
    }).then((response: any) => response.assertStatus(200))

    const log = await AuditLog.query().where('auditable_id', address.id).firstOrFail()
    assert.equal(log.customerId, customer.id)
    assert.isNull(log.userId)

    const response = await listActivity(client, account)
    response.assertStatus(200)
    const [entry] = response.body().data
    assert.equal(entry.action, 'updated')
    assert.equal(entry.auditableType, 'CustomerAddress')
    assert.equal(entry.auditableLabel, '1 George Street, Sydney')
    assert.deepEqual(entry.changes, { before: { city: 'Sydney' }, after: { city: 'Melbourne' } })
    assert.notProperty(entry, 'auditableId')
    assert.notProperty(entry, 'customerId')
  })

  test('logs an address delete without exposing the customer id', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const address = await createCustomerAddress(customer)

    await send(client, 'delete', account, `/account/addresses/${address.id}`).then(
      (response: any) => response.assertStatus(204)
    )

    const response = await listActivity(client, account)
    const [entry] = response.body().data
    assert.equal(entry.action, 'deleted')
    assert.isNull(entry.changes.after)
    assert.equal(entry.changes.before.city, 'Sydney')
    assert.notProperty(entry.changes.before, 'id')
    assert.notProperty(entry.changes.before, 'customerId')
    assert.notProperty(entry.changes, 'labels')
  })

  test('logs a profile update', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    await send(client, 'put', account, '/account/details', {
      fullName: 'Ana Cruz',
      email: customer.email,
      phone: customer.phone,
    }).then((response: any) => response.assertStatus(200))

    const response = await listActivity(client, account)
    const [entry] = response.body().data
    assert.equal(entry.auditableType, 'Customer')
    assert.deepEqual(entry.changes.after, { fullName: 'Ana Cruz' })
  })

  test('excludes other customers’ and staff changes', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { account: otherAccount, customer: other } = await createCustomerAccount()
    const otherAddress = await createCustomerAddress(other)
    const staff = await createAdminUser('admin')

    await send(client, 'put', otherAccount, `/account/addresses/${otherAddress.id}`, {
      ...ADDRESS_BODY,
      city: 'Perth',
    }).then((response: any) => response.assertStatus(200))
    await auditActor.run({ userId: staff.id, ipAddress: null }, async () => {
      customer.fullName = 'Edited by staff'
      await customer.save()
    })

    const response = await listActivity(client, account)
    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('returns the newest entries first, a page at a time', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const address = await createCustomerAddress(customer)

    for (const city of ['Perth', 'Hobart', 'Darwin']) {
      await send(client, 'put', account, `/account/addresses/${address.id}`, {
        ...ADDRESS_BODY,
        city,
      }).then((response: any) => response.assertStatus(200))
    }

    const first = await listActivity(client, account, { page: 1, perPage: 2 })
    const second = await listActivity(client, account, { page: 2, perPage: 2 })

    assert.deepEqual(
      first.body().data.map((entry: any) => entry.changes.after.city),
      ['Darwin', 'Hobart']
    )
    assert.deepEqual(
      second.body().data.map((entry: any) => entry.changes.after.city),
      ['Perth']
    )
    assert.equal(first.body().metadata.total, 3)
  })

  test('rejects an out-of-range page size', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await listActivity(client, account, { perPage: 500 })

    response.assertStatus(422)
  })

  test('requires a signed-in customer', async ({ client }) => {
    const response = await client.get('/account/activity/list').accept('json')

    response.assertStatus(401)
  })
})
