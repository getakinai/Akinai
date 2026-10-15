import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { ANALYTICS_SESSION_COOKIE, ANALYTICS_VISITOR_COOKIE } from '#constants/analytics'
import AnalyticsEvent from '#models/analytics_event'
import AnalyticsSession from '#models/analytics_session'
import AnalyticsSessionRepository from '#repositories/analytics_session_repository'
import MarketService from '#services/market_service'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'
import { createOrderProduct } from '#tests/helpers/orders'

const URL = '/store/analytics/events'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

type Body = Record<string, unknown>

function send(
  client: ApiClient,
  body: Body,
  {
    userAgent = IPHONE,
    cookies = {},
  }: { userAgent?: string; cookies?: Record<string, string> } = {}
) {
  let request = client
    .post(URL)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .header('User-Agent', userAgent)
  for (const [name, value] of Object.entries(cookies)) {
    request = request.withEncryptedCookie(name, value)
  }
  return request
}

async function sessionCount() {
  return (await AnalyticsSession.all()).length
}

async function useMarket() {
  const markets = await app.container.make(MarketService)
  return markets.ensurePrimary({
    name: 'Australia',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    countryCodes: ['AU'],
  })
}

test.group('Storefront analytics events: recording', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))

  test('the first page view starts a session and sets both cookies', async ({ client, assert }) => {
    const market = await useMarket()

    const response = await send(client, {
      type: 'page_view',
      path: '/collections/mugs',
      referrer: 'https://www.google.com/search?q=mugs',
    })

    response.assertStatus(200)
    response.assertBody({ data: { recorded: true } })
    assert.exists(response.cookie(ANALYTICS_SESSION_COOKIE))
    assert.exists(response.cookie(ANALYTICS_VISITOR_COOKIE))

    const session = await AnalyticsSession.query().firstOrFail()
    assert.equal(session.landingPath, '/collections/mugs')
    assert.equal(session.referrerHost, 'google.com')
    assert.equal(session.source, 'search')
    assert.equal(session.deviceType, 'mobile')
    assert.equal(session.marketId, market.id)
    assert.isNull(session.customerId)
    assert.equal(session.pageViews, 1)
    assert.isFalse(session.viewedProduct)

    const events = await AnalyticsEvent.query().where('session_id', session.id)
    assert.lengthOf(events, 1)
    assert.equal(events[0].type, 'page_view')
  })

  test('stores UTM tags and classifies a click id as paid', async ({ client, assert }) => {
    await useMarket()

    const response = await send(client, {
      type: 'page_view',
      path: '/',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'spring-sale',
      hasClickId: true,
    })

    response.assertStatus(200)
    const session = await AnalyticsSession.query().firstOrFail()
    assert.equal(session.source, 'paid')
    assert.equal(session.utmSource, 'google')
    assert.equal(session.utmMedium, 'cpc')
    assert.equal(session.utmCampaign, 'spring-sale')
  })

  test('later events with the session cookie reuse the session and set funnel flags', async ({
    client,
    assert,
  }) => {
    await useMarket()
    const { product } = await createOrderProduct('Analytics mug', 20)

    await send(client, { type: 'page_view', path: '/' })
    const session = await AnalyticsSession.query().firstOrFail()
    const cookies = {
      [ANALYTICS_SESSION_COOKIE]: session.id,
      [ANALYTICS_VISITOR_COOKIE]: session.visitorId,
    }

    await send(client, { type: 'page_view', path: '/products/mug' }, { cookies })
    await send(
      client,
      { type: 'product_view', path: '/products/mug', productId: product.id },
      { cookies }
    )
    await send(
      client,
      { type: 'add_to_cart', path: '/products/mug', productId: product.id },
      { cookies }
    )
    await send(client, { type: 'checkout_started', path: '/checkout' }, { cookies })

    assert.equal(await sessionCount(), 1)
    await session.refresh()
    assert.equal(session.pageViews, 2)
    assert.isTrue(session.viewedProduct)
    assert.isTrue(session.addedToCart)
    assert.isTrue(session.reachedCheckout)
    assert.isNull(session.convertedOrderId)

    const productEvents = await AnalyticsEvent.query()
      .where('session_id', session.id)
      .where('product_id', product.id)
    assert.lengthOf(productEvents, 2)
  })

  test('an expired session cookie starts a new session for the same visitor', async ({
    client,
    assert,
  }) => {
    await useMarket()
    await send(client, { type: 'page_view', path: '/' })
    const first = await AnalyticsSession.query().firstOrFail()
    await first.merge({ lastSeenAt: DateTime.now().minus({ minutes: 45 }) }).save()

    await send(
      client,
      { type: 'page_view', path: '/collections' },
      {
        cookies: {
          [ANALYTICS_SESSION_COOKIE]: first.id,
          [ANALYTICS_VISITOR_COOKIE]: first.visitorId,
        },
      }
    )

    const sessions = await AnalyticsSession.query().orderBy('started_at', 'asc')
    assert.lengthOf(sessions, 2)
    assert.equal(sessions[1].visitorId, first.visitorId)
    assert.equal(sessions[1].landingPath, '/collections')
  })

  test('a forged session cookie value starts a new session', async ({ client, assert }) => {
    await useMarket()

    const response = await send(
      client,
      { type: 'page_view', path: '/' },
      { cookies: { [ANALYTICS_SESSION_COOKIE]: 'not-a-uuid' } }
    )

    response.assertStatus(200)
    assert.equal(await sessionCount(), 1)
  })

  test('an unknown product id is stored as null', async ({ client, assert }) => {
    await useMarket()

    const response = await send(client, {
      type: 'product_view',
      path: '/products/gone',
      productId: '0199a0f2-0000-7000-8000-000000000000',
    })

    response.assertStatus(200)
    const event = await AnalyticsEvent.query().firstOrFail()
    assert.isNull(event.productId)
  })

  test('links the session to the signed-in customer', async ({ client, assert }) => {
    await useMarket()
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, { type: 'page_view', path: '/' })
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    const session = await AnalyticsSession.query().firstOrFail()
    assert.equal(session.customerId, customer.id)
  })

  test('marks the session converted when an order is placed', async ({ client, assert }) => {
    await useMarket()
    await send(client, { type: 'page_view', path: '/' })
    const session = await AnalyticsSession.query().firstOrFail()
    const order = await createPlacedOrder(null)
    const repository = await app.container.make(AnalyticsSessionRepository)

    await repository.recordEvent(
      session.id,
      { type: 'order_placed', path: '/checkout', productId: null, orderId: order.id },
      new Date()
    )

    await session.refresh()
    assert.equal(session.convertedOrderId, order.id)
    assert.isTrue(session.reachedCheckout)
  })
})

test.group('Storefront analytics events: not tracked', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))

  test('ignores bots', async ({ client, assert }) => {
    await useMarket()

    const response = await send(
      client,
      { type: 'page_view', path: '/' },
      { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
    )

    response.assertStatus(200)
    response.assertBody({ data: { recorded: false } })
    assert.equal(await sessionCount(), 0)
    assert.notExists(response.cookie(ANALYTICS_VISITOR_COOKIE))
  })

  test('honours Global Privacy Control and Do Not Track', async ({ client, assert }) => {
    await useMarket()

    const gpc = await send(client, { type: 'page_view', path: '/' }).header('Sec-GPC', '1')
    const dnt = await send(client, { type: 'page_view', path: '/' }).header('DNT', '1')

    gpc.assertBody({ data: { recorded: false } })
    dnt.assertBody({ data: { recorded: false } })
    assert.equal(await sessionCount(), 0)
  })
})

test.group('Storefront analytics events: validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))

  test('rejects an unknown event type', async ({ client }) => {
    const response = await send(client, { type: 'purchase', path: '/' })
    response.assertStatus(422)
  })

  test('order_placed can only be recorded by the server', async ({ client }) => {
    const response = await send(client, { type: 'order_placed', path: '/checkout' })
    response.assertStatus(422)
  })

  test('rejects paths that are not site-relative', async ({ client }) => {
    for (const path of ['https://evil.example/', 'products', '/with space', '']) {
      const response = await send(client, { type: 'page_view', path })
      response.assertStatus(422)
    }
  })

  test('rejects a non-uuid product id and a string click flag', async ({ client }) => {
    const badProduct = await send(client, { type: 'product_view', path: '/', productId: '42' })
    const badFlag = await send(client, { type: 'page_view', path: '/', hasClickId: 'true' })

    badProduct.assertStatus(422)
    badFlag.assertStatus(422)
  })

  test('rejects over-long UTM values', async ({ client }) => {
    const response = await send(client, {
      type: 'page_view',
      path: '/',
      utmCampaign: 'x'.repeat(101),
    })
    response.assertStatus(422)
  })
})
