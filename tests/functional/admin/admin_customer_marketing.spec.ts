import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditLog from '#models/audit_log'
import type Customer from '#models/customer'
import CustomerTag from '#models/customer_tag'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

type Body = Record<string, unknown>

let sequence = 0

function put(client: ApiClient, user: User, url: string, body: Body) {
  return client.put(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)
}

function editor() {
  return createAdminUser(['customers.view', 'customers.edit'])
}

async function tag(customer: Customer, ...names: string[]) {
  await CustomerTag.createMany(names.map((name) => ({ customerId: customer.id, name })))
}

test.group('Admin customers: tags and notes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('saves tags (trimmed, lowercased, deduplicated) and the note', async ({
    client,
    assert,
  }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()

    const response = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: [' VIP ', 'wholesale', 'vip'],
      note: '  Prefers morning delivery  ',
    })

    response.assertStatus(200)
    const data = response.body().data
    assert.deepEqual(data.tags, ['vip', 'wholesale'])
    assert.equal(data.note, 'Prefers morning delivery')
    const rows = await CustomerTag.query().where('customer_id', customer.id)
    assert.lengthOf(rows, 2)
  })

  test('replaces the tags, keeping only the ones sent', async ({ client, assert }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    await tag(customer, 'vip', 'old')

    const response = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: ['vip', 'new'],
      note: null,
    })

    response.assertStatus(200)
    assert.deepEqual(response.body().data.tags, ['new', 'vip'])
    assert.isNull(response.body().data.note)
  })

  test('writes one audit entry with the tag and note changes', async ({ client, assert }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    await tag(customer, 'old')

    await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: ['vip'],
      note: 'Call first',
    })

    const logs = await AuditLog.query()
      .where('auditable_id', customer.id)
      .where('action', 'updated')
    assert.lengthOf(logs, 1)
    assert.equal(logs[0].userId, user.id)
    assert.deepEqual(logs[0].changes.before, { note: null, tags: ['old'] })
    assert.deepEqual(logs[0].changes.after, { note: 'Call first', tags: ['vip'] })
  })

  test('saving without changes writes no audit entry', async ({ client, assert }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    await tag(customer, 'vip')

    await put(client, user, `/admin/customers/${customer.id}/notes`, { tags: ['vip'], note: null })

    const logs = await AuditLog.query()
      .where('auditable_id', customer.id)
      .where('action', 'updated')
    assert.lengthOf(logs, 0)
  })

  test('rejects too many tags, long tags and a long note', async ({ client }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()

    const tooMany = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      note: null,
    })
    const tooLong = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: ['a'.repeat(41)],
      note: 'b'.repeat(5001),
    })

    tooMany.assertStatus(422)
    tooMany.assertBodyContains({ errors: [{ field: 'tags' }] })
    tooLong.assertStatus(422)
    tooLong.assertBodyContains({ errors: [{ field: 'tags.0' }, { field: 'note' }] })
  })

  test('rejects tags that are not strings', async ({ client }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()

    const response = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: [123],
      note: null,
    })

    response.assertStatus(422)
  })

  test('an archived customer must be unarchived first', async ({ client }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    await customer.merge({ isActive: false }).save()

    const response = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: ['vip'],
      note: null,
    })

    response.assertStatus(422)
  })

  test('staff without customers.edit get 403', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])
    const { customer } = await createCustomerAccount()

    const response = await put(client, user, `/admin/customers/${customer.id}/notes`, {
      tags: ['vip'],
      note: null,
    })

    response.assertStatus(403)
  })

  test('the view endpoint returns the tags, note and consent', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])
    const { customer } = await createCustomerAccount()
    await customer.merge({ note: 'Gift buyer', acceptsMarketing: true }).save()
    await tag(customer, 'vip')

    const response = await client
      .get(`/admin/customers/view/${customer.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: { note: 'Gift buyer', tags: ['vip'], acceptsMarketing: true },
    })
  })
})

test.group('Admin customers: marketing consent', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('staff can subscribe and unsubscribe a customer', async ({ client, assert }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    const url = `/admin/customers/${customer.id}/marketing`

    const on = await put(client, user, url, { acceptsMarketing: true })
    on.assertStatus(200)
    on.assertBodyContains({ data: { acceptsMarketing: true, marketingConsentSource: 'admin' } })
    assert.isNotNull(on.body().data.marketingConsentAt)

    const off = await put(client, user, url, { acceptsMarketing: false })
    off.assertStatus(200)
    await customer.refresh()
    assert.isFalse(customer.acceptsMarketing)
  })

  test('rejects a value that is not a boolean', async ({ client }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()

    const response = await put(client, user, `/admin/customers/${customer.id}/marketing`, {
      acceptsMarketing: 'true',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'acceptsMarketing' }] })
  })

  test('an archived customer must be unarchived first', async ({ client }) => {
    const user = await editor()
    const { customer } = await createCustomerAccount()
    await customer.merge({ isActive: false }).save()

    const response = await put(client, user, `/admin/customers/${customer.id}/marketing`, {
      acceptsMarketing: true,
    })

    response.assertStatus(422)
  })

  test('staff without customers.edit get 403', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])
    const { customer } = await createCustomerAccount()

    const response = await put(client, user, `/admin/customers/${customer.id}/marketing`, {
      acceptsMarketing: true,
    })

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const { customer } = await createCustomerAccount()

    const response = await client
      .put(`/admin/customers/${customer.id}/marketing`)
      .json({ acceptsMarketing: true })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})

test.group('Admin customers: list filters', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(30_000)

  /** Customers named after a per-test marker, so `q` scopes the list to them. */
  async function customers<Name extends string>(
    ...names: Name[]
  ): Promise<{ marker: string } & Record<Name, Customer>> {
    sequence++
    const marker = `seg${sequence}x${Date.now()}`
    const created = {} as Record<Name, Customer>
    for (const name of names) {
      const { customer } = await createCustomerAccount({ fullName: `${marker} ${name}` })
      created[name] = customer
    }
    return { marker, ...created }
  }

  async function listIds(client: ApiClient, qs: Body) {
    const user = await createAdminUser(['customers.view'])
    const response = await client
      .get('/admin/customers/list')
      .qs({ perPage: 100, ...qs })
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)
    return response.body().data.map((row: { id: string }) => row.id) as string[]
  }

  test('filters by tag', async ({ client, assert }) => {
    const { marker, a, b, c } = await customers('a', 'b', 'c')
    await tag(a, 'vip')
    await tag(b, 'wholesale')

    const ids = await listIds(client, { q: marker, tags: ['vip', 'wholesale'] })

    assert.sameMembers(ids, [a.id, b.id])
    assert.notInclude(ids, c.id)
  })

  test('filters by marketing consent', async ({ client, assert }) => {
    const { marker, yes, no } = await customers('yes', 'no')
    await yes.merge({ acceptsMarketing: true }).save()

    const subscribed = await listIds(client, { q: marker, marketing: 'subscribed' })
    const notSubscribed = await listIds(client, { q: marker, marketing: 'not_subscribed' })

    assert.deepEqual(subscribed, [yes.id])
    assert.deepEqual(notSubscribed, [no.id])
  })

  test('filters by country', async ({ client, assert }) => {
    const { marker, nz, ph } = await customers('nz', 'ph')
    await ph.merge({ countryCode: 'PH' }).save()

    const ids = await listIds(client, { q: marker, countryCode: 'PH' })

    assert.deepEqual(ids, [ph.id])
    assert.notInclude(ids, nz.id)
  })

  test('filters by number of open orders, ignoring drafts', async ({ client, assert }) => {
    const { marker, none, one, three } = await customers('none', 'one', 'three')
    await createPlacedOrder(none, { status: 'draft' })
    await createPlacedOrder(one)
    for (let index = 0; index < 3; index++) await createPlacedOrder(three)

    const atLeastOne = await listIds(client, { q: marker, ordersMin: 1 })
    const noneOrOne = await listIds(client, { q: marker, ordersMax: 1 })
    const exactlyThree = await listIds(client, { q: marker, ordersMin: 3, ordersMax: 3 })

    assert.sameMembers(atLeastOne, [one.id, three.id])
    assert.sameMembers(noneOrOne, [none.id, one.id])
    assert.deepEqual(exactlyThree, [three.id])
  })

  test('the list shows each customer’s order count and tags', async ({ client, assert }) => {
    const { marker, buyer } = await customers('buyer')
    await createPlacedOrder(buyer)
    await createPlacedOrder(buyer)
    await tag(buyer, 'vip')
    const user = await createAdminUser(['customers.view'])

    const response = await client
      .get('/admin/customers/list')
      .qs({ q: marker })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    const [row] = response.body().data
    assert.equal(row.ordersCount, 2)
    assert.deepEqual(row.tags, ['vip'])
    assert.isNotNull(row.lastOrderAt)
  })

  test('filters by total spent in the chosen currency', async ({ client, assert }) => {
    const { marker, small, big } = await customers('small', 'big')
    await createPlacedOrder(small, { quantity: 1 })
    await createPlacedOrder(big, { quantity: 10 })

    const over100 = await listIds(client, { q: marker, spentCurrency: 'AUD', spentMin: 100 })
    const upTo50 = await listIds(client, { q: marker, spentCurrency: 'aud', spentMax: 50 })
    const otherCurrency = await listIds(client, { q: marker, spentCurrency: 'NZD', spentMin: 1 })

    assert.deepEqual(over100, [big.id])
    assert.deepEqual(upTo50, [small.id])
    assert.deepEqual(otherCurrency, [])
  })

  test('a spent range needs a currency', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])

    const response = await client
      .get('/admin/customers/list')
      .qs({ spentMin: 100 })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'spentCurrency' }] })
  })

  test('filters by last order date, including the end day', async ({ client, assert }) => {
    const { marker, recent, old, never } = await customers('recent', 'old', 'never')
    await createPlacedOrder(recent)
    await createPlacedOrder(old, { placedMinutesAgo: 60 * 24 * 30 })
    const today = DateTime.utc().toISODate()!

    const lastWeek = await listIds(client, {
      q: marker,
      lastOrderFrom: DateTime.utc().minus({ days: 7 }).toISODate(),
      lastOrderTo: today,
    })
    const before = await listIds(client, {
      q: marker,
      lastOrderTo: DateTime.utc().minus({ days: 7 }).toISODate(),
    })

    assert.deepEqual(lastWeek, [recent.id])
    assert.deepEqual(before, [old.id])
    assert.notInclude([...lastWeek, ...before], never.id)
  })

  test('rejects malformed filters', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])

    const response = await client
      .get('/admin/customers/list')
      .qs({ marketing: 'maybe', ordersMin: -1, lastOrderFrom: '2026-13-40', countryCode: 'ZZZ' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'marketing' },
        { field: 'countryCode' },
        { field: 'ordersMin' },
        { field: 'lastOrderFrom' },
      ],
    })
  })

  test('filter options list the tags, countries and order currencies', async ({
    client,
    assert,
  }) => {
    const { buyer } = await customers('buyer')
    await buyer.merge({ countryCode: 'PH' }).save()
    await tag(buyer, 'vip')
    await createPlacedOrder(buyer)
    const user = await createAdminUser(['customers.view'])

    const response = await client
      .get('/admin/customers/filter-options')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const data = response.body().data
    assert.include(data.tags, 'vip')
    assert.deepInclude(data.countries, { code: 'PH', name: 'Philippines' })
    assert.include(data.currencyCodes, 'AUD')
  })

  test('staff without customers.view get 403', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])

    const list = await client
      .get('/admin/customers/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    const options = await client
      .get('/admin/customers/filter-options')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    list.assertStatus(403)
    options.assertStatus(403)
  })
})
