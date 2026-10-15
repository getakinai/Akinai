import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type CustomerAccount from '#models/customer_account'
import CustomerAddress from '#models/customer_address'
import CustomerAccountModel from '#models/customer_account'
import Customer from '#models/customer'
import PaymentMethodService from '#services/payment_method_service'
import {
  CUSTOMER_PASSWORD,
  createCustomerAccount,
  createCustomerAddress,
  createPlacedOrder,
} from '#tests/helpers/customers'
import { createOrderProduct, seedOrderSetup } from '#tests/helpers/orders'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

type Body = Record<string, unknown>

function get(client: any, account: CustomerAccount, url: string, qs: Body = {}) {
  return client.get(url).qs(qs).accept('json').withGuard('customer').loginAs(account)
}

function send(
  client: any,
  method: 'post' | 'put' | 'delete',
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
  address1: '5 Queen Street',
  address2: null,
  city: 'Auckland',
  province: null,
  postalCode: '1010',
  countryCode: 'nz',
  phone: null,
  isDefault: false,
}

test.group('Customer account: orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists only the customer’s placed orders, newest first', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const older = await createPlacedOrder(customer, { placedMinutesAgo: 120, quantity: 3 })
    const newer = await createPlacedOrder(customer, { placedMinutesAgo: 5 })
    await createPlacedOrder(customer, { status: 'draft' })
    await createPlacedOrder(other)

    const response = await get(client, account, '/account/orders/list')

    response.assertStatus(200)
    const { data, metadata } = response.body()
    assert.deepEqual(
      data.map(({ id }: { id: string }) => id),
      [newer.id, older.id]
    )
    assert.equal(data[1].itemCount, 3)
    assert.equal(metadata.total, 2)
  })

  test('paginates with perPage', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    await createPlacedOrder(customer)
    await createPlacedOrder(customer)
    await createPlacedOrder(customer)

    const response = await get(client, account, '/account/orders/list', { page: 2, perPage: 2 })

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().metadata.lastPage, 2)
  })

  test('rejects an invalid perPage', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const response = await get(client, account, '/account/orders/list', { perPage: 500 })
    response.assertStatus(422)
  })

  test('shows the customer’s own order with its lines', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await get(client, account, `/account/orders/view/${order.id}`)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.id, order.id)
    assert.equal(data.orderNumber, order.orderNumber)
    assert.lengthOf(data.lineItems, 1)
  })

  test('returns 404 for another customer’s order', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const order = await createPlacedOrder(other)

    const view = await get(client, account, `/account/orders/view/${order.id}`)
    const show = await get(client, account, `/account/orders/${order.id}`)

    view.assertStatus(404)
    show.assertStatus(404)
  })

  test('returns 404 for a staff draft linked to the customer', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const draft = await createPlacedOrder(customer, { status: 'draft' })

    const response = await get(client, account, `/account/orders/view/${draft.id}`)
    response.assertStatus(404)
  })

  test('returns 404 for unknown and malformed ids', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const unknown = await get(client, account, `/account/orders/view/${UNKNOWN_ID}`)
    const malformed = await get(client, account, '/account/orders/view/not-a-uuid')

    unknown.assertStatus(404)
    malformed.assertStatus(404)
  })

  test('requires a signed-in customer', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const list = await client.get('/account/orders/list').accept('json')
    const view = await client.get(`/account/orders/view/${order.id}`).accept('json')

    list.assertStatus(401)
    view.assertStatus(401)
  })
})

test.group('Customer account: addresses', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists only the customer’s addresses, default first', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const first = await createCustomerAddress(customer)
    const second = await createCustomerAddress(customer, { isDefault: true })
    await createCustomerAddress(other)

    const response = await get(client, account, '/account/addresses/list')

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map(({ id }: { id: string }) => id),
      [second.id, first.id]
    )
  })

  test('adds an address; the first one becomes the default', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, 'post', account, '/account/addresses', ADDRESS_BODY)

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.countryCode, 'NZ')
    assert.isTrue(data.isDefault)
    const saved = await CustomerAddress.findOrFail(data.id)
    assert.equal(saved.customerId, customer.id)
  })

  test('ignores an owner id sent in the body', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()

    const response = await send(client, 'post', account, '/account/addresses', {
      ...ADDRESS_BODY,
      customerId: other.id,
    })

    response.assertStatus(201)
    const saved = await CustomerAddress.findOrFail(response.body().data.id)
    assert.equal(saved.customerId, customer.id)
  })

  test('validates the address', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()

    const response = await send(client, 'post', account, '/account/addresses', {
      ...ADDRESS_BODY,
      address1: '',
      city: '',
      countryCode: 'New Zealand',
    })

    response.assertStatus(422)
    const fields = response.body().errors.map(({ field }: { field: string }) => field)
    assert.includeMembers(fields, ['address1', 'city', 'countryCode'])
  })

  test('updates an own address and can make it the default', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const current = await createCustomerAddress(customer, { isDefault: true })
    const other = await createCustomerAddress(customer)

    const response = await send(client, 'put', account, `/account/addresses/${other.id}`, {
      ...ADDRESS_BODY,
      city: 'Wellington',
      isDefault: true,
    })

    response.assertStatus(200)
    assert.equal(response.body().data.city, 'Wellington')
    assert.isTrue(response.body().data.isDefault)
    await current.refresh()
    assert.isFalse(current.isDefault)
  })

  test('returns 404 when updating another customer’s address', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const address = await createCustomerAddress(other, { city: 'Sydney' })

    const response = await send(client, 'put', account, `/account/addresses/${address.id}`, {
      ...ADDRESS_BODY,
      city: 'Hacked',
    })

    response.assertStatus(404)
    await address.refresh()
    assert.equal(address.city, 'Sydney')
  })

  test('deletes the default address and promotes the newest other one', async ({
    client,
    assert,
  }) => {
    const { account, customer } = await createCustomerAccount()
    const defaultAddress = await createCustomerAddress(customer, { isDefault: true })
    const remaining = await createCustomerAddress(customer)

    const response = await send(
      client,
      'delete',
      account,
      `/account/addresses/${defaultAddress.id}`
    )

    response.assertStatus(204)
    assert.isNull(await CustomerAddress.find(defaultAddress.id))
    await remaining.refresh()
    assert.isTrue(remaining.isDefault)
  })

  test('returns 404 when deleting another customer’s address', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const address = await createCustomerAddress(other)

    const response = await send(client, 'delete', account, `/account/addresses/${address.id}`)

    response.assertStatus(404)
    assert.isNotNull(await CustomerAddress.find(address.id))
  })

  test('requires a signed-in customer', async ({ client }) => {
    const response = await client
      .post('/account/addresses')
      .json(ADDRESS_BODY)
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})

test.group('Customer account: details', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updates name and phone without a password', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, 'put', account, '/account/details', {
      fullName: 'Ana Cruz',
      email: customer.email,
      phone: '+6421000000',
    })

    response.assertStatus(200)
    assert.equal(response.body().data.fullName, 'Ana Cruz')
    await customer.refresh()
    assert.equal(customer.phone, '+6421000000')
  })

  test('needs the current password to change the email', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    const missing = await send(client, 'put', account, '/account/details', {
      fullName: customer.fullName,
      email: 'new-email@example.com',
      phone: null,
    })
    const wrong = await send(client, 'put', account, '/account/details', {
      fullName: customer.fullName,
      email: 'new-email@example.com',
      phone: null,
      currentPassword: 'not-the-password',
    })

    missing.assertStatus(422)
    wrong.assertStatus(422)
    assert.equal(missing.body().errors[0].field, 'currentPassword')
    assert.equal(wrong.body().errors[0].field, 'currentPassword')
    await customer.refresh()
    assert.notEqual(customer.email, 'new-email@example.com')
  })

  test('changes the email on the profile and the login', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, 'put', account, '/account/details', {
      fullName: customer.fullName,
      email: 'New-Login@Example.com',
      phone: null,
      currentPassword: CUSTOMER_PASSWORD,
    })

    response.assertStatus(200)
    assert.equal(response.body().data.email, 'new-login@example.com')
    const login = await CustomerAccountModel.findOrFail(account.id)
    assert.equal(login.email, 'new-login@example.com')
    const profile = await Customer.findOrFail(customer.id)
    assert.equal(profile.email, 'new-login@example.com')
  })

  test('rejects an email another customer uses', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()

    const response = await send(client, 'put', account, '/account/details', {
      fullName: customer.fullName,
      email: other.email,
      phone: null,
      currentPassword: CUSTOMER_PASSWORD,
    })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'email')
  })
})

test.group('Checkout thank-you page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows a recent order to its owner', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { placedMinutesAgo: 5 })

    const response = await get(client, account, `/checkout/orders/view/${order.id}`)
    response.assertStatus(200)
  })

  test('expires 30 minutes after the order was placed', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { placedMinutesAgo: 31 })

    const thankYou = await get(client, account, `/checkout/orders/view/${order.id}`)
    const accountView = await get(client, account, `/account/orders/view/${order.id}`)

    thankYou.assertStatus(410)
    assert.equal(thankYou.body().errors[0].message, 'This confirmation link has expired')
    accountView.assertStatus(200)
  })

  test('hides other customers’ orders', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const order = await createPlacedOrder(other, { placedMinutesAgo: 5 })

    const signedIn = await get(client, account, `/checkout/orders/view/${order.id}`)
    const guest = await client.get(`/checkout/orders/view/${order.id}`).accept('json')

    signedIn.assertStatus(404)
    guest.assertStatus(404)
  })
})

test.group('Checkout: redirect after placing an order', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  async function setup() {
    const { market, rate } = await seedOrderSetup()
    const paymentMethods = await app.container.make(PaymentMethodService)
    await paymentMethods.updateBankTransfer(market.id, {
      isEnabled: true,
      countryCode: 'AU',
      accountName: 'Store',
      bankName: 'Bank',
      accountNumber: '123456',
      bsb: '062-000',
    })
    const { variant } = await createOrderProduct('Mug', 20)
    return {
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      countryCode: 'AU',
      province: 'NSW',
      postalCode: '2000',
      shippingRateId: rate.id,
      lastName: 'Buyer',
      firstName: 'Jane',
      address1: '1 George Street',
      city: 'Sydney',
      phone: '+61400000000',
      paymentMethod: 'bank_transfer',
    }
  }

  test('sends signed-in customers to their account overview', async ({ client, assert }) => {
    const body = await setup()
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, 'post', account, '/checkout', {
      ...body,
      email: customer.email,
    })

    response.assertStatus(201)
    assert.match(response.body().data.redirectTo, /^\/account\?placed=[0-9a-f-]{36}$/)
  })

  test('keeps guests on the thank-you page', async ({ client, assert }) => {
    const body = await setup()

    const response = await client
      .post('/checkout')
      .json({ ...body, email: `guest-${Date.now()}@example.com` })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(201)
    assert.match(response.body().data.redirectTo, /^\/checkout\/thank-you\/[0-9a-f-]{36}$/)
  })
})
