import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import CustomerSegment from '#models/customer_segment'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'

type Body = Record<string, unknown>

const EMPTY_FILTERS = {
  tags: [],
  marketing: null,
  countryCode: null,
  ordersMin: null,
  ordersMax: null,
  spentCurrency: null,
  spentMin: null,
  spentMax: null,
  lastOrderFrom: null,
  lastOrderTo: null,
}

let sequence = 0

function uniqueName(prefix = 'Segment') {
  sequence++
  return `${prefix} ${sequence} ${Date.now()}`
}

function editor() {
  return createAdminUser(['customers.view', 'customers.edit'])
}

function send(
  client: ApiClient,
  method: 'post' | 'put' | 'delete',
  user: User,
  url: string,
  body: Body = {}
) {
  return client[method](url)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

test.group('Admin customer segments', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('saves a segment with only the filters in use', async ({ client, assert }) => {
    const user = await editor()
    const name = uniqueName('Subscribed VIPs')

    const response = await send(client, 'post', user, '/admin/customers/segments', {
      name: `  ${name}  `,
      filters: {
        tags: ['VIP'],
        marketing: 'subscribed',
        countryCode: 'ph',
        ordersMin: 2,
        spentCurrency: 'aud',
        spentMin: 100,
        lastOrderFrom: '2026-01-01',
      },
    })

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        name,
        filters: {
          ...EMPTY_FILTERS,
          tags: ['vip'],
          marketing: 'subscribed',
          countryCode: 'PH',
          ordersMin: 2,
          spentCurrency: 'AUD',
          spentMin: 100,
          lastOrderFrom: '2026-01-01',
        },
      },
    })
    const segment = await CustomerSegment.findOrFail(response.body().data.id)
    assert.deepEqual(segment.filters, {
      tags: ['vip'],
      marketing: 'subscribed',
      countryCode: 'PH',
      ordersMin: 2,
      spentCurrency: 'AUD',
      spentMin: 100,
      lastOrderFrom: '2026-01-01',
    })
  })

  test('lists saved segments', async ({ client, assert }) => {
    const user = await createAdminUser(['customers.view'])
    const name = uniqueName()
    await CustomerSegment.create({ name, filters: { marketing: 'subscribed' } })

    const response = await client
      .get('/admin/customers/segments/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const saved = response.body().data.find((row: { name: string }) => row.name === name)
    assert.deepEqual(saved.filters, { ...EMPTY_FILTERS, marketing: 'subscribed' })
  })

  test('names are unique regardless of case', async ({ client }) => {
    const user = await editor()
    const name = uniqueName('Wholesale')
    await CustomerSegment.create({ name, filters: {} })

    const response = await send(client, 'post', user, '/admin/customers/segments', {
      name: name.toUpperCase(),
      filters: {},
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name' }] })
  })

  test('a name with LIKE wildcards only matches itself', async ({ client }) => {
    const user = await editor()
    await CustomerSegment.create({ name: uniqueName('Top 10'), filters: {} })

    const response = await send(client, 'post', user, '/admin/customers/segments', {
      name: '%',
      filters: {},
    })

    response.assertStatus(201)
  })

  test('updates a segment and may keep its own name', async ({ client, assert }) => {
    const user = await editor()
    const name = uniqueName()
    const segment = await CustomerSegment.create({ name, filters: { tags: ['vip'] } })

    const response = await send(client, 'put', user, `/admin/customers/segments/${segment.id}`, {
      name,
      filters: { marketing: 'not_subscribed' },
    })

    response.assertStatus(200)
    await segment.refresh()
    assert.deepEqual(segment.filters, { marketing: 'not_subscribed' })
  })

  test('cannot rename a segment to another segment’s name', async ({ client }) => {
    const user = await editor()
    const taken = uniqueName()
    await CustomerSegment.create({ name: taken, filters: {} })
    const segment = await CustomerSegment.create({ name: uniqueName(), filters: {} })

    const response = await send(client, 'put', user, `/admin/customers/segments/${segment.id}`, {
      name: taken,
      filters: {},
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name' }] })
  })

  test('deletes a segment', async ({ client, assert }) => {
    const user = await editor()
    const segment = await CustomerSegment.create({ name: uniqueName(), filters: {} })

    const response = await send(client, 'delete', user, `/admin/customers/segments/${segment.id}`)

    response.assertStatus(204)
    assert.isNull(await CustomerSegment.find(segment.id))
  })

  test('an unknown segment id returns 404', async ({ client }) => {
    const user = await editor()

    const response = await send(
      client,
      'delete',
      user,
      '/admin/customers/segments/0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
    )

    response.assertStatus(404)
  })

  test('filter numbers must be real numbers in the JSON body', async ({ client }) => {
    const user = await editor()

    const response = await send(client, 'post', user, '/admin/customers/segments', {
      name: uniqueName(),
      filters: { ordersMin: '2', spentCurrency: 'AUD', spentMin: '100' },
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'filters.ordersMin' }, { field: 'filters.spentMin' }],
    })
  })

  test('rejects a missing name and a spent range without a currency', async ({ client }) => {
    const user = await editor()

    const response = await send(client, 'post', user, '/admin/customers/segments', {
      name: '   ',
      filters: { spentMax: 50 },
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'name' }, { field: 'filters.spentCurrency' }],
    })
  })

  test('staff without customers.edit can list but not change segments', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])
    const segment = await CustomerSegment.create({ name: uniqueName(), filters: {} })

    const list = await client
      .get('/admin/customers/segments/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    const store = await send(client, 'post', user, '/admin/customers/segments', {
      name: uniqueName(),
      filters: {},
    })
    const update = await send(client, 'put', user, `/admin/customers/segments/${segment.id}`, {
      name: segment.name,
      filters: {},
    })
    const remove = await send(client, 'delete', user, `/admin/customers/segments/${segment.id}`)

    list.assertStatus(200)
    store.assertStatus(403)
    update.assertStatus(403)
    remove.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client
      .post('/admin/customers/segments')
      .json({ name: uniqueName(), filters: {} })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})
