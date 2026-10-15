import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'
import PaymentMethod, { type PaymentMethodConfig } from '#models/payment_method'
import PaymentMethodMarket from '#models/payment_method_market'
import PaymentMethodRepository from '#repositories/payment_method_repository'
import MarketService from '#services/market_service'
import PaymentMethodService from '#services/payment_method_service'
import PoliGatewayService from '#services/poli_gateway_service'
import StripeGatewayService from '#services/stripe_gateway_service'

class FakeStripeGateway extends StripeGatewayService {
  async verifySecretKey() {
    return 'valid' as const
  }
}

const NZ_BANK = {
  isEnabled: true,
  countryCode: 'NZ' as const,
  accountName: 'Store NZ',
  bankName: 'ANZ',
  accountNumber: '12-3456-0123456-00',
}

const AU_BANK = {
  isEnabled: true,
  countryCode: 'AU' as const,
  accountName: 'Store AU',
  bankName: 'Commonwealth Bank',
  accountNumber: '123456',
  bsb: '062-000',
}

const AU_BANK_CONFIG = {
  countryCode: 'AU' as const,
  accountName: 'Store AU',
  bankName: 'Commonwealth Bank',
  accountNumber: '123456',
  bsb: '062-000',
  instructions: null,
}

const STRIPE_KEYS = {
  mode: 'test' as const,
  test: { publishableKey: 'pk_test_abc123', secretKey: 'sk_test_abc1234567' }, // gitleaks:allow
}

const POLI_CREDENTIALS = {
  mode: 'test' as const,
  test: { merchantCode: 'SS6100', authenticationCode: 'auth-code-1234' },
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

test.group('PaymentMethodService: per market', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    app.container.swap(
      StripeGatewayService,
      () => new FakeStripeGateway(new PaymentMethodRepository())
    )
    return () => app.container.restore(StripeGatewayService)
  })
  group.each.timeout(10_000)

  test('checkout only offers methods enabled in the shopper market', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updateBankTransfer(au.id, AU_BANK)

    assert.deepEqual(await service.enabledForCheckout(nz), [])
    const auMethods = await service.enabledForCheckout(au)
    assert.deepEqual(
      auMethods.map((method) => method.code),
      ['bank_transfer']
    )
    assert.equal(auMethods[0].bankTransfer?.accountName, 'Store AU')
    assert.isFalse(await service.isEnabled('bank_transfer', nz))
    assert.isTrue(await service.isEnabled('bank_transfer', au))
  })

  test('each market keeps its own bank account', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updateBankTransfer(nz.id, NZ_BANK)
    await service.updateBankTransfer(au.id, AU_BANK)

    const [nzMethods, auMethods] = await Promise.all([
      service.enabledForCheckout(nz),
      service.enabledForCheckout(au),
    ])
    assert.equal(nzMethods[0].bankTransfer?.accountNumber, NZ_BANK.accountNumber)
    assert.equal(auMethods[0].bankTransfer?.bsb, '062-000')

    const setup = await service.bankTransfer()
    assert.lengthOf(setup.markets, 2)
    assert.equal(setup.markets[0].marketId, nz.id)
  })

  test('a switched-off market keeps its bank details for placed orders', async ({ assert }) => {
    const { au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updateBankTransfer(au.id, AU_BANK)
    await service.updateBankTransfer(au.id, { ...AU_BANK, isEnabled: false })

    assert.deepEqual(await service.enabledForCheckout(au), [])
    assert.equal((await service.bankTransferForMarket(au.id))?.accountName, 'Store AU')
    assert.isNull(await service.bankTransferForMarket(null))
  })

  test('list shows the markets each method is offered in', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updateBankTransfer(nz.id, NZ_BANK)
    await service.updateBankTransfer(au.id, { ...AU_BANK, isEnabled: false })

    const list = await service.list()
    const bank = list.find((method) => method.code === 'bank_transfer')!
    const stripe = list.find((method) => method.code === 'stripe')!

    assert.deepEqual(bank.markets, [{ id: nz.id, name: 'New Zealand' }])
    assert.isTrue(bank.isEnabled)
    assert.isTrue(bank.configured)
    assert.deepEqual(stripe.markets, [])
    assert.isFalse(stripe.isEnabled)
    assert.isFalse(stripe.configured)
  })

  test('updating bank transfer for an archived market is not found', async ({ assert }) => {
    const { au, marketService } = await seedMarkets()
    await marketService.archive(au)
    const service = await app.container.make(PaymentMethodService)

    await assert.rejects(
      () => service.updateBankTransfer(au.id, AU_BANK),
      lucidErrors.E_ROW_NOT_FOUND
    )
  })

  test('Stripe is offered in exactly the chosen markets', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)

    const first = await service.updateStripe({ ...STRIPE_KEYS, marketIds: [nz.id, au.id] })
    assert.sameMembers(first.marketIds, [nz.id, au.id])
    assert.isTrue(first.isEnabled)

    const second = await service.updateStripe({ mode: 'test', marketIds: [au.id] })
    assert.deepEqual(second.marketIds, [au.id])
    assert.deepEqual(await service.enabledForCheckout(nz), [])
    assert.deepEqual(
      (await service.enabledForCheckout(au)).map((method) => method.code),
      ['stripe']
    )
    assert.lengthOf(await PaymentMethodMarket.all(), 2)
  })

  test('Stripe with no markets is set up but switched off', async ({ assert }) => {
    const { nz } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)

    const setup = await service.updateStripe({ ...STRIPE_KEYS, marketIds: [] })

    assert.isFalse(setup.isEnabled)
    assert.equal(setup.test?.secretKeyLastFour, '4567')
    assert.deepEqual(await service.enabledForCheckout(nz), [])
  })

  test('assigns setups saved before markets to markets', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    await PaymentMethod.createMany([
      {
        code: 'bank_transfer',
        isEnabled: true,
        config: { ...AU_BANK_CONFIG },
      },
      {
        code: 'stripe',
        isEnabled: true,
        config: {
          mode: 'test',
          publishableKey: 'pk_test_abc123', // gitleaks:allow
          secretKeyEncrypted: 'encrypted',
          secretKeyLastFour: '4567',
          webhookSecretEncrypted: null,
        } as unknown as PaymentMethodConfig,
      },
    ])
    const service = await app.container.make(PaymentMethodService)

    await service.assignLegacySetupsToMarkets()
    await service.assignLegacySetupsToMarkets()

    assert.deepEqual(
      (await service.enabledForCheckout(au)).map((method) => method.code),
      ['bank_transfer', 'stripe']
    )
    assert.deepEqual(
      (await service.enabledForCheckout(nz)).map((method) => method.code),
      ['stripe']
    )
    assert.lengthOf(await PaymentMethodMarket.all(), 3)
  })

  test('leaves methods that already have markets alone', async ({ assert }) => {
    const { nz, au } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updateBankTransfer(nz.id, NZ_BANK)
    const bank = await PaymentMethod.findByOrFail('code', 'bank_transfer')
    await bank.merge({ config: { ...AU_BANK_CONFIG } }).save()

    await service.assignLegacySetupsToMarkets()

    assert.deepEqual(await service.enabledForCheckout(au), [])
    assert.equal((await service.bankTransferForMarket(nz.id))?.accountName, 'Store NZ')
  })

  test('POLi is offered only in NZD and AUD markets', async ({ assert }) => {
    const { nz, au, marketService } = await seedMarkets()
    const sg = await marketService.create({
      name: 'Singapore',
      currencyCode: 'SGD',
      pricesIncludeTax: true,
      countryCodes: ['SG'],
    })
    const service = await app.container.make(PaymentMethodService)

    await assert.rejects(
      () => service.updatePoli({ ...POLI_CREDENTIALS, marketIds: [nz.id, sg.id] }),
      vineErrors.E_VALIDATION_ERROR
    )

    const setup = await service.updatePoli({ ...POLI_CREDENTIALS, marketIds: [nz.id, au.id] })
    assert.isTrue(setup.isEnabled)
    assert.sameMembers(setup.marketIds, [nz.id, au.id])
    assert.deepEqual(
      (await service.enabledForCheckout(nz)).map((method) => ({
        code: method.code,
        name: method.name,
      })),
      [{ code: 'poli', name: 'POLi (online banking)' }]
    )
    assert.deepEqual(await service.enabledForCheckout(sg), [])

    await PaymentMethodMarket.create({
      paymentMethodId: (await PaymentMethod.findByOrFail('code', 'poli')).id,
      marketId: sg.id,
      isEnabled: true,
      config: null,
    })
    assert.deepEqual(await service.enabledForCheckout(sg), [])
    const poli = (await service.list()).find((method) => method.code === 'poli')!
    assert.notInclude(
      poli.markets.map((market) => market.id),
      sg.id
    )
  })

  test('POLi keeps the stored authentication code and never returns it', async ({ assert }) => {
    const { nz } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updatePoli({ ...POLI_CREDENTIALS, marketIds: [nz.id] })

    const setup = await service.updatePoli({
      mode: 'test',
      test: { merchantCode: 'SS6200', authenticationCode: null },
      marketIds: [nz.id],
    })

    assert.deepEqual(setup.test, { merchantCode: 'SS6200', authCodeLastFour: '1234' })
    const gateway = await app.container.make(PoliGatewayService)
    const credentials = await gateway.credentials()
    assert.equal(credentials?.authenticationCode, 'auth-code-1234')
    assert.equal(credentials?.merchantCode, 'SS6200')
  })

  test('POLi needs credentials for the mode it is switched to', async ({ assert }) => {
    const { nz } = await seedMarkets()
    const service = await app.container.make(PaymentMethodService)
    await service.updatePoli({ ...POLI_CREDENTIALS, marketIds: [nz.id] })

    await assert.rejects(
      () => service.updatePoli({ mode: 'live', marketIds: [nz.id] }),
      vineErrors.E_VALIDATION_ERROR
    )
    await assert.rejects(
      () =>
        service.updatePoli({
          mode: 'live',
          live: { merchantCode: 'SS7000', authenticationCode: null },
          marketIds: [nz.id],
        }),
      vineErrors.E_VALIDATION_ERROR
    )

    const list = await service.list()
    const poli = list.find((method) => method.code === 'poli')!
    assert.isTrue(poli.configured)
    assert.equal(poli.mode, 'test')

    const stripe = list.find((method) => method.code === 'stripe')!
    assert.isFalse(stripe.configured)
    assert.isNull(stripe.mode)
  })

  test('Stripe rejects markets that are not active', async ({ assert }) => {
    const { au, marketService } = await seedMarkets()
    await marketService.archive(au)
    const service = await app.container.make(PaymentMethodService)

    await assert.rejects(
      () => service.updateStripe({ ...STRIPE_KEYS, marketIds: [au.id] }),
      vineErrors.E_VALIDATION_ERROR
    )
  })
})
