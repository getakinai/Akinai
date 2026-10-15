import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import PaymentMethodRepository from '#repositories/payment_method_repository'
import MarketService from '#services/market_service'
import PluginService from '#services/plugin_service'
import StripeGatewayService from '#services/stripe_gateway_service'
import { createAdminUser } from '#tests/helpers/admin'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

class FakeStripeGateway extends StripeGatewayService {
  async verifySecretKey() {
    return 'valid' as const
  }
}

const NZ_BANK = {
  isEnabled: true,
  countryCode: 'NZ',
  accountName: 'Store NZ',
  bankName: 'ANZ',
  accountNumber: '12-3456-0123456-00',
  bsb: null,
  instructions: null,
}

const STRIPE_KEYS = {
  mode: 'test',
  test: { publishableKey: 'pk_test_abc123', secretKey: 'sk_test_abc1234567', webhookSecret: null }, // gitleaks:allow
}

async function seedMarkets() {
  const marketService = await app.container.make(MarketService)
  const nz = await marketService.ensurePrimary({
    name: 'New Zealand',
    currencyCode: 'NZD',
    pricesIncludeTax: true,
    countryCodes: ['NZ'],
  })
  const au = await marketService.create({
    name: 'Australia',
    currencyCode: 'AUD',
    pricesIncludeTax: true,
    countryCodes: ['AU'],
  })
  return { nz, au, marketService }
}

function get(client: any, user: User, url: string) {
  return client.get(url).accept('json').withGuard('web').loginAs(user)
}

function put(client: any, user: User, url: string, body: Record<string, unknown>) {
  return client.put(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)
}

test.group('Staff payments: markets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists active markets, primary first', async ({ client, assert }) => {
    const { au, marketService } = await seedMarkets()
    await marketService.create({
      name: 'Singapore',
      currencyCode: 'SGD',
      pricesIncludeTax: true,
      countryCodes: ['SG'],
    })
    const malaysia = await marketService.create({
      name: 'Malaysia',
      currencyCode: 'MYR',
      pricesIncludeTax: true,
      countryCodes: ['MY'],
    })
    await marketService.archive(malaysia)
    const user = await createAdminUser(['payments.view'])

    const response = await get(client, user, '/admin/payments/markets')

    response.assertStatus(200)
    const rows = response.body().data
    assert.equal(rows[0].name, 'New Zealand')
    assert.isTrue(rows[0].isPrimary)
    assert.deepEqual(rows[0].countryCodes, ['NZ'])
    assert.includeMembers(
      rows.map((row: { id: string }) => row.id),
      [au.id]
    )
    assert.notInclude(
      rows.map((row: { name: string }) => row.name),
      'Malaysia'
    )
  })

  test('requires the payments.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await get(client, user, '/admin/payments/markets')

    response.assertStatus(403)
  })
})

test.group('Staff payments: bank transfer per market', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves the bank account for one market only', async ({ client, assert }) => {
    const { nz, au } = await seedMarkets()
    const user = await createAdminUser(['payments.view', 'payments.edit'])

    const response = await put(client, user, `/admin/payments/bank-transfer/${nz.id}`, NZ_BANK)

    response.assertStatus(200)
    const markets = response.body().data.markets
    const nzRow = markets.find((row: { marketId: string }) => row.marketId === nz.id)
    const auRow = markets.find((row: { marketId: string }) => row.marketId === au.id)
    assert.equal(nzRow.accountName, 'Store NZ')
    assert.isTrue(nzRow.isEnabled)
    assert.isNull(auRow.accountName)
    assert.isFalse(auRow.isEnabled)

    const list = await get(client, user, '/admin/payments/list')
    const bank = list
      .body()
      .data.find((method: { code: string }) => method.code === 'bank_transfer')
    assert.deepEqual(bank.markets, [{ id: nz.id, name: 'New Zealand' }])
  })

  test('returns 404 for an unknown or archived market', async ({ client }) => {
    const { au, marketService } = await seedMarkets()
    await marketService.archive(au)
    const user = await createAdminUser(['payments.edit'])

    const unknown = await put(client, user, `/admin/payments/bank-transfer/${UNKNOWN_ID}`, NZ_BANK)
    const archived = await put(client, user, `/admin/payments/bank-transfer/${au.id}`, NZ_BANK)

    unknown.assertStatus(404)
    archived.assertStatus(404)
  })

  test('validates the account details', async ({ client }) => {
    const { nz } = await seedMarkets()
    const user = await createAdminUser(['payments.edit'])

    const response = await put(client, user, `/admin/payments/bank-transfer/${nz.id}`, {
      ...NZ_BANK,
      isEnabled: 'true',
      accountNumber: '123',
    })

    response.assertStatus(422)
  })

  test('requires the payments.edit permission', async ({ client }) => {
    const { nz } = await seedMarkets()
    const user = await createAdminUser(['payments.view'])

    const response = await put(client, user, `/admin/payments/bank-transfer/${nz.id}`, NZ_BANK)

    response.assertStatus(403)
  })
})

test.group('Staff payments: Stripe markets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    app.container.swap(
      StripeGatewayService,
      () => new FakeStripeGateway(new PaymentMethodRepository())
    )
    return () => app.container.restore(StripeGatewayService)
  })

  test('offers Stripe in the chosen markets', async ({ client, assert }) => {
    const { nz, au } = await seedMarkets()
    const user = await createAdminUser(['payments.view', 'payments.edit'])

    const first = await put(client, user, '/admin/payments/stripe', {
      ...STRIPE_KEYS,
      marketIds: [nz.id, au.id],
    })
    first.assertStatus(200)
    assert.sameMembers(first.body().data.marketIds, [nz.id, au.id])

    const second = await put(client, user, '/admin/payments/stripe', {
      mode: 'test',
      marketIds: [au.id],
    })
    second.assertStatus(200)
    assert.deepEqual(second.body().data.marketIds, [au.id])
    assert.notProperty(second.body().data.test, 'secretKeyEncrypted')

    const list = await get(client, user, '/admin/payments/list')
    const stripe = list.body().data.find((method: { code: string }) => method.code === 'stripe')
    assert.deepEqual(stripe.markets, [{ id: au.id, name: 'Australia' }])
  })

  test('rejects markets that are unknown or not ids', async ({ client }) => {
    await seedMarkets()
    const user = await createAdminUser(['payments.edit'])

    const unknown = await put(client, user, '/admin/payments/stripe', {
      ...STRIPE_KEYS,
      marketIds: [UNKNOWN_ID],
    })
    const malformed = await put(client, user, '/admin/payments/stripe', {
      ...STRIPE_KEYS,
      marketIds: 'all',
    })
    const duplicated = await put(client, user, '/admin/payments/stripe', {
      ...STRIPE_KEYS,
      marketIds: [UNKNOWN_ID, UNKNOWN_ID],
    })

    unknown.assertStatus(422)
    malformed.assertStatus(422)
    duplicated.assertStatus(422)
  })
})

const POLI_CREDENTIALS = {
  mode: 'test',
  test: { merchantCode: 'SS6100', authenticationCode: 'auth-code-1234' },
}

test.group('Staff payments: POLi', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves POLi without ever returning the authentication code', async ({ client, assert }) => {
    const { nz, au } = await seedMarkets()
    const user = await createAdminUser(['payments.view', 'payments.edit'])

    const saved = await put(client, user, '/admin/payments/poli', {
      ...POLI_CREDENTIALS,
      marketIds: [nz.id, au.id],
    })
    saved.assertStatus(200)
    assert.deepEqual(saved.body().data.test, { merchantCode: 'SS6100', authCodeLastFour: '1234' })
    assert.isTrue(saved.body().data.isEnabled)
    assert.notInclude(JSON.stringify(saved.body()), 'auth-code-1234')

    const view = await get(client, user, '/admin/payments/poli/view')
    view.assertStatus(200)
    assert.equal(view.body().data.mode, 'test')
    assert.sameMembers(view.body().data.marketIds, [nz.id, au.id])
    assert.notInclude(JSON.stringify(view.body()), 'authCodeEncrypted')

    const list = await get(client, user, '/admin/payments/list')
    const poli = list.body().data.find((method: { code: string }) => method.code === 'poli')
    assert.equal(poli.status, 'available')
    assert.isTrue(poli.configured)
    assert.lengthOf(poli.markets, 2)
  })

  test('rejects markets that do not use NZD or AUD', async ({ client }) => {
    const { nz, marketService } = await seedMarkets()
    const sg = await marketService.create({
      name: 'Singapore',
      currencyCode: 'SGD',
      pricesIncludeTax: true,
      countryCodes: ['SG'],
    })
    const user = await createAdminUser(['payments.edit'])

    const response = await put(client, user, '/admin/payments/poli', {
      ...POLI_CREDENTIALS,
      marketIds: [nz.id, sg.id],
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'marketIds' }] })
  })

  test('needs credentials for the chosen mode', async ({ client }) => {
    const { nz } = await seedMarkets()
    const user = await createAdminUser(['payments.edit'])

    const noLive = await put(client, user, '/admin/payments/poli', {
      ...POLI_CREDENTIALS,
      mode: 'live',
      marketIds: [nz.id],
    })
    const noCode = await put(client, user, '/admin/payments/poli', {
      mode: 'test',
      test: { merchantCode: 'SS6100', authenticationCode: null },
      marketIds: [nz.id],
    })
    const badMode = await put(client, user, '/admin/payments/poli', {
      ...POLI_CREDENTIALS,
      mode: 'production',
      marketIds: [nz.id],
    })

    noLive.assertStatus(422)
    noLive.assertBodyContains({ errors: [{ field: 'live.merchantCode' }] })
    noCode.assertStatus(422)
    noCode.assertBodyContains({ errors: [{ field: 'test.authenticationCode' }] })
    badMode.assertStatus(422)
  })

  test('requires the payments permissions', async ({ client }) => {
    const { nz } = await seedMarkets()
    const viewer = await createAdminUser(['payments.view'])
    const other = await createAdminUser(['products.view'])

    const update = await put(client, viewer, '/admin/payments/poli', {
      ...POLI_CREDENTIALS,
      marketIds: [nz.id],
    })
    const view = await get(client, other, '/admin/payments/poli/view')

    update.assertStatus(403)
    view.assertStatus(403)
  })
})

test.group('Staff payments: plugin install state', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an uninstalled payment plugin is left out of the list', async ({ client, assert }) => {
    await seedMarkets()
    const plugins = await app.container.make(PluginService)
    await plugins.uninstall('stripe')
    const user = await createAdminUser(['payments.view'])

    const response = await get(client, user, '/admin/payments/list')

    response.assertStatus(200)
    const codes = response.body().data.map((method: { code: string }) => method.code)
    assert.notInclude(codes, 'stripe')
    assert.includeMembers(codes, ['bank_transfer', 'poli'])
  })

  test('lists installed payment plugins before the coming-soon methods', async ({
    client,
    assert,
  }) => {
    await seedMarkets()
    const user = await createAdminUser(['payments.view'])

    const response = await get(client, user, '/admin/payments/list')

    response.assertStatus(200)
    const rows: { code: string; status: string }[] = response.body().data
    assert.deepEqual(
      rows.slice(0, 3).map((row) => row.code),
      ['bank_transfer', 'stripe', 'poli']
    )
    assert.isTrue(rows.slice(3).every((row) => row.status === 'coming_soon'))
    assert.include(
      rows.map((row) => row.code),
      'windcave'
    )
  })

  test('setup routes return 404 while the plugin is uninstalled', async ({ client }) => {
    await seedMarkets()
    const plugins = await app.container.make(PluginService)
    await plugins.uninstall('stripe')
    const user = await createAdminUser(['payments.view', 'payments.edit'])

    const view = await get(client, user, '/admin/payments/stripe/view')
    const update = await put(client, user, '/admin/payments/stripe', {
      ...STRIPE_KEYS,
      marketIds: [],
    })

    view.assertStatus(404)
    update.assertStatus(404)
  })
})
