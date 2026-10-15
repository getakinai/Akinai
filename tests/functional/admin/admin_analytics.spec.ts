import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { v7 as uuidv7 } from 'uuid'
import { ANALYTICS_REPORT_KEYS } from '#constants/analytics_reports'
import AnalyticsSession from '#models/analytics_session'
import type Customer from '#models/customer'
import Order, { type OrderStatus } from '#models/order'
import type User from '#models/user'
import StoreSettingService from '#services/store_setting_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount } from '#tests/helpers/customers'
import { createOrderCustomer, createOrderProduct } from '#tests/helpers/orders'

let sequence = 0

function get(client: ApiClient, user: User, url: string, qs: Record<string, string> = {}) {
  return client.get(url).qs(qs).accept('json').withGuard('web').loginAs(user)
}

async function useStore() {
  const settings = await app.container.make(StoreSettingService)
  const current = await settings.get()
  await current.merge({ currencyCode: 'AUD', timezone: 'UTC', locale: 'en-AU' }).save()
}

async function placeOrder({
  customer = null,
  total,
  daysAgo,
  status = 'open',
}: {
  customer?: Customer | null
  total: number
  daysAgo: number
  status?: OrderStatus
}) {
  sequence++
  const number = 700_000 + sequence
  const draft = status === 'draft'
  return Order.create({
    draftNumber: number,
    orderNumber: draft ? null : number,
    status,
    paymentStatus: draft ? null : 'paid',
    paymentMethod: draft ? null : 'bank_transfer',
    customerId: customer?.id ?? null,
    email: customer?.email ?? `analytics-guest-${sequence}@example.com`,
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    taxAppliesToShipping: false,
    shippingTitle: 'Standard',
    subtotal: total,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    total,
    completedAt: draft ? null : DateTime.now().minus({ days: daysAgo }),
  })
}

async function recordSession({
  daysAgo = 0,
  minutesAgo = 0,
  source = 'direct',
  deviceType = 'desktop',
  viewedProduct = false,
  addedToCart = false,
  reachedCheckout = false,
  convertedOrderId = null,
}: {
  daysAgo?: number
  minutesAgo?: number
  source?: AnalyticsSession['source']
  deviceType?: AnalyticsSession['deviceType']
  viewedProduct?: boolean
  addedToCart?: boolean
  reachedCheckout?: boolean
  convertedOrderId?: string | null
}) {
  const at = DateTime.now().minus({ days: daysAgo, minutes: minutesAgo })
  return AnalyticsSession.create({
    visitorId: uuidv7(),
    customerId: null,
    marketId: null,
    startedAt: at,
    lastSeenAt: at,
    landingPath: '/',
    referrerHost: source === 'search' ? 'google.com' : null,
    source,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    deviceType,
    pageViews: 1,
    viewedProduct,
    addedToCart,
    reachedCheckout,
    convertedOrderId,
  })
}

type Card = {
  key: string
  value: number
  previous: number | null
  reportKey: string
  spark: unknown[]
}

const card = (cards: Card[], key: string) => cards.find((item) => item.key === key)!

test.group('Admin analytics: access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const jsonUrls = [
    '/admin/analytics/view',
    '/admin/analytics/reports/list',
    '/admin/analytics/reports/sales_over_time/view',
    '/admin/analytics/live/view',
  ]

  test('requires a signed-in staff user', async ({ client }) => {
    for (const url of jsonUrls) {
      const response = await client.get(url).accept('json')
      response.assertStatus(401)
    }
  })

  test('forbids staff without analytics.view', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    for (const url of jsonUrls) {
      const response = await get(client, user, url)
      response.assertStatus(403)
    }
  })

  test('a storefront customer cannot reach analytics', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await client
      .get('/admin/analytics/view')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(401)
  })
})

test.group('Admin analytics: validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rejects malformed dates and unknown comparisons', async ({ client }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])

    const invalid: Record<string, string>[] = [
      { from: '2026/10/01' },
      { to: 'yesterday' },
      { compare: 'last_month' },
      { from: '2026-10-01T00:00' },
    ]
    for (const qs of invalid) {
      const response = await get(client, user, '/admin/analytics/view', qs)
      response.assertStatus(422)
    }
  })

  test('returns 404 for an unknown report key', async ({ client }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])

    const view = await get(client, user, '/admin/analytics/reports/not_a_report/view')
    const shell = await get(client, user, '/admin/analytics/reports/not_a_report')

    view.assertStatus(404)
    shell.assertStatus(404)
  })
})

test.group('Admin analytics: dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows zeros and a no-sessions note for an empty store', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])

    const response = await get(client, user, '/admin/analytics/view')

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.range.compare, 'previous_period')
    assert.equal(data.range.grain, 'day')
    assert.equal(data.money.currencyCode, 'AUD')
    assert.deepEqual(
      data.cards.map((item: Card) => item.key),
      [
        'total_sales',
        'sessions',
        'conversion_rate',
        'returning_customer_rate',
        'average_order_value',
        'orders',
      ]
    )
    assert.isTrue(data.cards.every((item: Card) => item.value === 0))
    assert.lengthOf(card(data.cards, 'total_sales').spark, 30)
    assert.lengthOf(data.notes, 1)
    assert.match(data.notes[0], /No storefront sessions/)
  })

  test('totals sales, sessions, conversion and returning customers with a comparison', async ({
    client,
    assert,
  }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    const { customer: returning } = await createOrderCustomer()

    await placeOrder({ customer: returning, total: 80, daysAgo: 40 })
    const converted = await placeOrder({ customer: returning, total: 100, daysAgo: 2 })
    await placeOrder({ total: 50, daysAgo: 3 })
    await placeOrder({ total: 5000, daysAgo: 1, status: 'draft' })

    await recordSession({ daysAgo: 40 })
    await recordSession({
      daysAgo: 2,
      source: 'search',
      deviceType: 'mobile',
      viewedProduct: true,
      addedToCart: true,
      reachedCheckout: true,
      convertedOrderId: converted.id,
    })
    await recordSession({ daysAgo: 3, source: 'search', deviceType: 'mobile', viewedProduct: true })
    await recordSession({ daysAgo: 4, deviceType: 'mobile' })
    await recordSession({ daysAgo: 5 })

    const response = await get(client, user, '/admin/analytics/view')

    response.assertStatus(200)
    const { data } = response.body()
    assert.deepInclude(card(data.cards, 'total_sales'), {
      value: 150,
      previous: 80,
      reportKey: 'sales_over_time',
    })
    assert.deepInclude(card(data.cards, 'orders'), { value: 2, previous: 1 })
    assert.deepInclude(card(data.cards, 'sessions'), { value: 4, previous: 1 })
    assert.deepInclude(card(data.cards, 'conversion_rate'), { value: 25, previous: 0 })
    assert.deepInclude(card(data.cards, 'average_order_value'), { value: 75, previous: 80 })
    assert.deepInclude(card(data.cards, 'returning_customer_rate'), { value: 50, previous: 0 })

    assert.deepEqual(
      data.funnel.map((step: { sessions: number }) => step.sessions),
      [4, 2, 1, 1, 1]
    )
    assert.deepInclude(data.sessionsByDevice[0], { sessions: 3, percent: 75 })

    assert.lengthOf(data.notes, 1)
    assert.match(data.notes[0], /Session tracking started/)
  })

  test('compare=none drops the comparison values', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await placeOrder({ total: 60, daysAgo: 1 })

    const response = await get(client, user, '/admin/analytics/view', { compare: 'none' })

    response.assertStatus(200)
    const { data } = response.body()
    assert.isNull(data.range.previousFrom)
    assert.isTrue(data.cards.every((item: Card) => item.previous === null))
    assert.equal(card(data.cards, 'total_sales').value, 60)
  })

  test('an explicit range only counts orders inside it', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await placeOrder({ total: 40, daysAgo: 1 })
    await placeOrder({ total: 70, daysAgo: 10 })
    const from = DateTime.now().setZone('UTC').minus({ days: 2 }).toISODate()!
    const to = DateTime.now().setZone('UTC').toISODate()!

    const response = await get(client, user, '/admin/analytics/view', { from, to })

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.range.from, from)
    assert.equal(data.range.to, to)
    assert.equal(card(data.cards, 'total_sales').value, 40)
  })
})

test.group('Admin analytics: reports', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists every report as created by the store', async ({ client, assert }) => {
    const user = await createAdminUser(['analytics.view'])

    const response = await get(client, user, '/admin/analytics/reports/list')

    response.assertStatus(200)
    const categories = response.body().data.categories as {
      key: string
      available: boolean
      reports: { key: string; createdBy: string }[]
    }[]
    const reports = categories.flatMap((category) => category.reports)
    assert.sameMembers(
      reports.map((report) => report.key),
      [...ANALYTICS_REPORT_KEYS]
    )
    assert.isTrue(reports.every((report) => report.createdBy === 'Store'))
    assert.isFalse(categories.find((category) => category.key === 'fraud')!.available)
  })

  test('every report builds with data in the store', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    const { customer } = await createOrderCustomer()
    await createOrderProduct('Report mug', 25, { stock: 3 })
    const order = await placeOrder({ customer, total: 90, daysAgo: 2 })
    await placeOrder({ customer, total: 45, daysAgo: 40 })
    await recordSession({ daysAgo: 2, source: 'search', convertedOrderId: order.id })

    for (const key of ANALYTICS_REPORT_KEYS) {
      const response = await get(client, user, `/admin/analytics/reports/${key}/view`)
      response.assertStatus(200)
      const { data } = response.body()
      assert.equal(data.key, key, `report ${key}`)
      assert.isArray(data.columns, `report ${key}`)
      assert.isArray(data.rows, `report ${key}`)
    }
  })

  test('sales over time totals the period and lists every day', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await placeOrder({ total: 120, daysAgo: 1 })
    await placeOrder({ total: 30, daysAgo: 2 })

    const response = await get(client, user, '/admin/analytics/reports/sales_over_time/view', {
      compare: 'none',
    })

    response.assertStatus(200)
    const { data } = response.body()
    const total = data.summary.find((item: { key: string }) => item.key === 'total')
    assert.equal(total.value, 150)
    assert.isNull(total.previous)
    assert.lengthOf(data.rows, 30)
    assert.equal(data.chart.type, 'line')
  })

  test('sessions by source counts sessions per source', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await recordSession({ daysAgo: 1, source: 'search' })
    await recordSession({ daysAgo: 1, source: 'search' })
    await recordSession({ daysAgo: 2, source: 'social' })

    const response = await get(client, user, '/admin/analytics/reports/sessions_by_source/view')

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.summary[0].value, 3)
    assert.deepInclude(data.rows[0], { sessions: 2 })
  })

  test('inventory reports ignore the date range', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await createOrderProduct('Low stock mug', 25, { stock: 1 })

    const response = await get(client, user, '/admin/analytics/reports/low_stock/view')

    response.assertStatus(200)
    const { data } = response.body()
    assert.isTrue(data.ignoresRange)
    assert.isTrue(data.notes.some((note: string) => /date range does not apply/.test(note)))
  })
})

test.group('Admin analytics: live view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('counts visitors active in the last few minutes and today’s orders', async ({
    client,
    assert,
  }) => {
    await useStore()
    const user = await createAdminUser(['analytics.view'])
    await recordSession({ minutesAgo: 1, addedToCart: true })
    await recordSession({ minutesAgo: 2, reachedCheckout: true })
    await recordSession({ minutesAgo: 20 })
    await placeOrder({ total: 55, daysAgo: 0 })

    const response = await get(client, user, '/admin/analytics/live/view')

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.windowMinutes, 5)
    assert.equal(data.visitorsNow, 2)
    assert.equal(data.activeCarts, 1)
    assert.equal(data.activeCheckouts, 1)
    assert.equal(data.ordersToday, 1)
    assert.equal(data.salesToday, 55)
    assert.lengthOf(data.minutes, 30)
    assert.lengthOf(data.recentOrders, 1)
    assert.notProperty(data.recentOrders[0], 'email')
  })
})
