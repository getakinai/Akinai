import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import CustomerRepository from '#repositories/customer_repository'
import MarketService from '#services/market_service'
import PaymentMethodService from '#services/payment_method_service'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'
import { createOrderProduct, seedOrderSetup } from '#tests/helpers/orders'

const AU_BANK = {
  isEnabled: true,
  countryCode: 'AU' as const,
  accountName: 'Store AU',
  bankName: 'Commonwealth Bank',
  accountNumber: '123456',
  bsb: '062-000',
}

const NZ_BANK = {
  isEnabled: true,
  countryCode: 'NZ' as const,
  accountName: 'Store NZ',
  bankName: 'ANZ',
  accountNumber: '12-3456-0123456-00',
}

/** Australia is the primary market (from `seedOrderSetup`); New Zealand is a second one. */
async function seedMarkets() {
  const setup = await seedOrderSetup()
  const marketService = await app.container.make(MarketService)
  const nz = await marketService.create({
    name: 'New Zealand',
    currencyCode: 'NZD',
    pricesIncludeTax: true,
    countryCodes: ['NZ'],
  })
  const paymentMethods = await app.container.make(PaymentMethodService)
  return { ...setup, au: setup.market, nz, paymentMethods }
}

test.group('Checkout: payment methods per market', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('only lists methods enabled in the shopper market', async ({ client, assert }) => {
    const { nz, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(nz.id, NZ_BANK)

    const response = await client.get('/checkout/payment-methods').accept('json')

    response.assertStatus(200)
    assert.deepEqual(response.body().data, [])
  })

  test('lists the bank account of the shopper market', async ({ client, assert }) => {
    const { au, nz, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(au.id, AU_BANK)
    await paymentMethods.updateBankTransfer(nz.id, NZ_BANK)
    const { account, customer } = await createCustomerAccount()
    const customerRepository = await app.container.make(CustomerRepository)
    await customerRepository.setMarket(customer, nz.id)

    const guest = await client.get('/checkout/payment-methods').accept('json')
    const signedIn = await client
      .get('/checkout/payment-methods')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    assert.equal(guest.body().data[0].bankTransfer.accountName, 'Store AU')
    assert.equal(signedIn.body().data[0].bankTransfer.accountName, 'Store NZ')
  })

  test('rejects a method not offered in the shopper market', async ({ client }) => {
    const { nz, rate, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(nz.id, NZ_BANK)
    const { variant } = await createOrderProduct('Mug', 20)

    const response = await client
      .post('/checkout')
      .json({
        lineItems: [{ variantId: variant.id, quantity: 1 }],
        countryCode: 'AU',
        province: 'NSW',
        postalCode: '2000',
        shippingRateId: rate.id,
        email: `guest-${Date.now()}@example.com`,
        firstName: 'Jane',
        lastName: 'Buyer',
        address1: '1 George Street',
        city: 'Sydney',
        phone: '+61400000000',
        paymentMethod: 'bank_transfer',
      })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'paymentMethod' }] })
  })
})

test.group('Order views: bank account of the order market', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('shows the bank account of the market the order was placed in', async ({
    client,
    assert,
  }) => {
    const { au, nz, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(au.id, AU_BANK)
    await paymentMethods.updateBankTransfer(nz.id, NZ_BANK)
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    await order.merge({ marketId: nz.id }).save()

    const response = await client
      .get(`/account/orders/view/${order.id}`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    assert.equal(response.body().data.bankTransfer.accountName, 'Store NZ')
  })

  test('has no bank account for card orders', async ({ client, assert }) => {
    const { au, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(au.id, AU_BANK)
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { paymentMethod: 'stripe' })
    await order.merge({ marketId: au.id }).save()

    const response = await client
      .get(`/account/orders/view/${order.id}`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    assert.isNull(response.body().data.bankTransfer)
  })

  test('another customer gets 404', async ({ client }) => {
    const { au, paymentMethods } = await seedMarkets()
    await paymentMethods.updateBankTransfer(au.id, AU_BANK)
    const { customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await client
      .get(`/account/orders/view/${order.id}`)
      .accept('json')
      .withGuard('customer')
      .loginAs(other)

    response.assertStatus(404)
  })
})
