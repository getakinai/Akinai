import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type Customer from '#models/customer'
import Order, { type OrderPaymentStatus, type OrderStatus } from '#models/order'
import type User from '#models/user'
import MarketService from '#services/market_service'
import StoreSettingService from '#services/store_setting_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createOrderCustomer, createOrderProduct } from '#tests/helpers/orders'

const URL = '/admin/dashboard/view'

let sequence = 0

function get(client: any, user: User, qs: Record<string, string> = {}) {
  return client.get(URL).qs(qs).accept('json').withGuard('web').loginAs(user)
}

async function useStore(currencyCode = 'AUD') {
  const settings = await app.container.make(StoreSettingService)
  const current = await settings.get()
  await current.merge({ currencyCode, timezone: 'UTC', locale: 'en-AU' }).save()
}

async function useMarket() {
  const markets = await app.container.make(MarketService)
  return markets.ensurePrimary({
    name: 'Oceania',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    countryCodes: ['AU', 'NZ', 'FJ', 'WS'],
  })
}

type PlacedOrder = {
  customer?: Customer | null
  total: number
  daysAgo: number
  currencyCode?: string
  status?: OrderStatus
  paymentStatus?: OrderPaymentStatus
  province?: string | null
  countryCode?: string
  discountTotal?: number
  marketId?: string | null
}

async function placeOrder({
  customer = null,
  marketId = null,
  total,
  daysAgo,
  currencyCode = 'AUD',
  status = 'open',
  paymentStatus = 'paid',
  province = 'NSW',
  countryCode = 'AU',
  discountTotal = 0,
}: PlacedOrder) {
  sequence++
  const number = 900_000 + sequence
  const draft = status === 'draft'
  return Order.create({
    draftNumber: number,
    orderNumber: draft ? null : number,
    status,
    paymentStatus: draft ? null : paymentStatus,
    paymentMethod: draft ? null : 'bank_transfer',
    customerId: customer?.id ?? null,
    marketId,
    email: customer?.email ?? `guest-${sequence}@example.com`,
    shippingAddress: {
      fullName: 'Jane Buyer',
      company: null,
      address1: '1 George Street',
      address2: null,
      city: 'Sydney',
      province,
      postalCode: '2000',
      countryCode,
      phone: null,
    },
    currencyCode,
    pricesIncludeTax: false,
    taxAppliesToShipping: false,
    shippingTitle: 'Standard',
    subtotal: total,
    discountTotal,
    shippingTotal: 0,
    taxTotal: 0,
    total,
    completedAt: draft ? null : DateTime.now().minus({ days: daysAgo }),
  })
}

test.group('Admin dashboard: access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('requires a signed-in staff user', async ({ client }) => {
    const response = await client.get(URL).accept('json')
    response.assertStatus(401)
  })

  test('forbids staff without orders.view', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const response = await get(client, user)
    response.assertStatus(403)
  })

  test('rejects an unknown range', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const response = await get(client, user, { range: '365d' })
    response.assertStatus(422)
  })
})

test.group('Admin dashboard: overview', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows zeros for an empty store with padded regions and months', async ({
    client,
    assert,
  }) => {
    await useStore()
    await useMarket()
    const user = await createAdminUser(['orders.view'])

    const response = await get(client, user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.range, '7d')
    assert.equal(data.days, 7)
    assert.equal(data.money.currencyCode, 'AUD')
    assert.deepEqual(data.current, {
      revenue: 0,
      orders: 0,
      newCustomers: 0,
      averageOrderValue: 0,
    })
    assert.deepEqual(data.changes.revenue, { percent: 0, trend: 'flat' })
    assert.notProperty(data, 'otherCurrencyOrders')
    assert.lengthOf(data.markets, 1)
    assert.deepInclude(data.markets[0], {
      name: 'Oceania',
      currencyCode: 'AUD',
      isPrimary: true,
      revenue: 0,
      orders: 0,
      averageOrderValue: 0,
      change: { percent: 0, trend: 'flat' },
    })
    assert.lengthOf(data.regions, 4)
    assert.isTrue(data.regions.every((region: { revenue: number }) => region.revenue === 0))
    assert.include(
      data.regions.map((region: { name: string }) => region.name),
      'Australia'
    )
    assert.deepEqual(data.gauges, { newCustomersPercent: 0, repeatPercent: 0, unpaidPercent: 0 })
    assert.lengthOf(data.monthly, 6)
    assert.isTrue(data.monthly.every((bar: { revenue: number }) => bar.revenue === 0))
    assert.deepEqual(data.month.salesGrowth, { percent: 0, trend: 'flat' })
    assert.deepEqual(data.todo, {
      toFulfill: 0,
      awaitingPayment: 0,
      paymentsToReview: 0,
      lowStock: 0,
      newReviews: 0,
      returnsToReview: 0,
    })
    assert.deepEqual(data.recentOrders, [])
  })

  test('totals placed orders in the store currency and compares periods', async ({
    client,
    assert,
  }) => {
    await useStore()
    const market = await useMarket()
    const user = await createAdminUser(['orders.view'])
    const { customer: repeat } = await createOrderCustomer()
    const { customer: firstTimer } = await createOrderCustomer()
    const { customer: earlier } = await createOrderCustomer()

    const marketId = market.id
    await placeOrder({ customer: repeat, total: 100, daysAgo: 20, marketId })
    await placeOrder({ customer: repeat, total: 200, daysAgo: 1, province: 'NSW', marketId })
    await placeOrder({
      customer: firstTimer,
      total: 100,
      daysAgo: 2,
      paymentStatus: 'pending',
      province: 'VIC',
      discountTotal: 5,
      marketId,
    })
    await placeOrder({ total: 999, daysAgo: 3, currencyCode: 'NZD', countryCode: 'NZ' })
    await placeOrder({ customer: earlier, total: 150, daysAgo: 10, marketId })
    await placeOrder({ customer: firstTimer, total: 5000, daysAgo: 1, status: 'draft', marketId })

    const response = await get(client, user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.deepEqual(data.current, {
      revenue: 300,
      orders: 2,
      newCustomers: 1,
      averageOrderValue: 150,
    })
    assert.deepEqual(data.previous, {
      revenue: 150,
      orders: 1,
      newCustomers: 1,
      averageOrderValue: 150,
    })
    assert.deepEqual(data.changes.revenue, { percent: 100, trend: 'up' })
    assert.deepEqual(data.changes.newCustomers, { percent: 0, trend: 'flat' })
    assert.deepEqual(data.changes.orders, { percent: 100, trend: 'up' })
    assert.notProperty(data, 'otherCurrencyOrders')
    assert.deepEqual(data.markets, [
      {
        marketId: market.id,
        name: 'Oceania',
        currencyCode: 'AUD',
        isPrimary: true,
        revenue: 300,
        orders: 2,
        averageOrderValue: 150,
        change: { percent: 100, trend: 'up' },
      },
      {
        marketId: null,
        name: 'Other (NZD)',
        currencyCode: 'NZD',
        isPrimary: false,
        revenue: 999,
        orders: 1,
        averageOrderValue: 999,
        change: { percent: null, trend: 'up' },
      },
    ])
    assert.deepEqual(data.gauges, { newCustomersPercent: 50, repeatPercent: 50, unpaidPercent: 33 })

    assert.deepEqual(data.regions.slice(0, 2), [
      { name: 'NSW', revenue: 200, percent: 67 },
      { name: 'VIC', revenue: 100, percent: 33 },
    ])
    assert.lengthOf(data.regions, 4)

    const monthlyTotal = data.monthly.reduce(
      (sum: number, bar: { revenue: number }) => sum + bar.revenue,
      0
    )
    assert.equal(monthlyTotal, 550)

    assert.equal(data.todo.toFulfill, 5)
    assert.equal(data.todo.awaitingPayment, 1)

    assert.lengthOf(data.recentOrders, 5)
    assert.equal(data.recentOrders[0].total, 200)
    assert.equal(data.recentOrders[0].customerName, repeat.fullName)
    assert.notProperty(data.recentOrders[0], 'shippingAddress')
  })

  test('widens the period with the range', async ({ client, assert }) => {
    await useStore()
    const user = await createAdminUser(['orders.view'])
    const { customer } = await createOrderCustomer()

    await placeOrder({ customer, total: 100, daysAgo: 20 })
    await placeOrder({ customer, total: 50, daysAgo: 1 })

    const week = (await get(client, user, { range: '7d' })).body().data
    const month = (await get(client, user, { range: '30d' })).body().data

    assert.equal(week.current.orders, 1)
    assert.equal(week.current.newCustomers, 0)
    assert.equal(month.days, 30)
    assert.equal(month.current.orders, 2)
    assert.equal(month.current.revenue, 150)
    assert.equal(month.current.newCustomers, 1)
  })

  test('counts tracked variants at or under the low-stock threshold', async ({
    client,
    assert,
  }) => {
    await useStore()
    const user = await createAdminUser(['orders.view'])
    await createOrderProduct('Low mug', 20, { stock: 2 })
    await createOrderProduct('Full mug', 20, { stock: 50 })
    await createOrderProduct('Untracked mug', 20)

    const response = await get(client, user)

    response.assertStatus(200)
    assert.equal(response.body().data.todo.lowStock, 1)
  })
})
