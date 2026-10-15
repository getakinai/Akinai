import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import mail from '@adonisjs/mail/services/main'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditLog from '#models/audit_log'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import CustomerVerificationCode from '#models/customer_verification_code'
import type CustomerAccountModel from '#models/customer_account'
import CustomerSignupCodeNotification from '#mails/customer_signup_code_notification'
import { createCustomerAccount } from '#tests/helpers/customers'
import { createOrderProduct, enableBankTransfer, seedOrderSetup } from '#tests/helpers/orders'

const PASSWORD = 'correct horse battery staple'

type Body = Record<string, unknown>

let sequence = 0

function uniqueEmail(prefix: string) {
  sequence++
  return `${prefix}-${sequence}-${Date.now()}@example.com`
}

function signupBody(overrides: Body = {}): Body {
  return {
    fullName: 'Jane Shopper',
    email: uniqueEmail('signup'),
    phone: null,
    password: PASSWORD,
    passwordConfirmation: PASSWORD,
    ...overrides,
  }
}

/** Starts a signup and enters the emailed code. */
async function signUp(client: ApiClient, body: Body) {
  const { mails } = mail.fake()
  const start = await client.post('/signup').json(body).accept('json').withCsrfToken()
  start.assertStatus(202)
  const [message] = mails.queued(
    (queued) => queued instanceof CustomerSignupCodeNotification && queued.to === body.email
  ) as CustomerSignupCodeNotification[]
  const row = await CustomerVerificationCode.findByOrFail('email', body.email)

  const verify = await client
    .post('/signup/verify')
    .json({ code: message.code })
    .withSession({ signup_verification_id: row.id })
    .accept('json')
    .withCsrfToken()
  verify.assertStatus(201)
  const account = await CustomerAccount.findByOrFail('email', body.email)
  return Customer.findOrFail(account.customerId)
}

function updateMarketing(client: ApiClient, account: CustomerAccountModel, body: Body) {
  return client
    .put('/account/marketing')
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

test.group('Customer marketing: signup', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return () => {
      mail.restore()
      return cleanup()
    }
  })
  group.each.timeout(20_000)

  test('ticking the box subscribes the new account', async ({ client, assert }) => {
    const customer = await signUp(client, signupBody({ acceptsMarketing: true }))

    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'signup')
    assert.isNotNull(customer.marketingConsentAt)
  })

  test('unticking the box leaves the account unsubscribed', async ({ client, assert }) => {
    const customer = await signUp(client, signupBody({ acceptsMarketing: false }))

    assert.isFalse(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'signup')
  })

  test('a signup without the field is not subscribed', async ({ client, assert }) => {
    const customer = await signUp(client, signupBody())

    assert.isFalse(customer.acceptsMarketing)
  })

  test('claiming a guest profile applies the choice made at signup', async ({
    client,
    assert,
  }) => {
    const guest = await Customer.create({
      email: uniqueEmail('guest'),
      fullName: 'Guest',
      phone: null,
      isActive: true,
      acceptsMarketing: false,
    })

    const customer = await signUp(
      client,
      signupBody({ email: guest.email, acceptsMarketing: true })
    )

    assert.equal(customer.id, guest.id)
    assert.isTrue(customer.acceptsMarketing)
  })

  test('rejects a consent value that is not a boolean', async ({ client }) => {
    mail.fake()
    const response = await client
      .post('/signup')
      .json(signupBody({ acceptsMarketing: 'true' }))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'acceptsMarketing' }] })
  })
})

test.group('Customer marketing: account toggle', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('the customer can turn marketing on and off', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()

    const on = await updateMarketing(client, account, { acceptsMarketing: true })
    on.assertStatus(200)
    on.assertBodyContains({ data: { id: customer.id, acceptsMarketing: true } })
    await customer.refresh()
    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'account')

    const off = await updateMarketing(client, account, { acceptsMarketing: false })
    off.assertStatus(200)
    await customer.refresh()
    assert.isFalse(customer.acceptsMarketing)
  })

  test('/account/me returns the choice but no staff-only fields', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    await customer.merge({ acceptsMarketing: true, note: 'VIP, handle with care' }).save()

    const response = await client
      .get('/account/me')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    const data = response.body().data
    assert.isTrue(data.acceptsMarketing)
    assert.notProperty(data, 'note')
    assert.notProperty(data, 'tags')
    assert.notProperty(data, 'marketingConsentSource')
  })

  test('only changes the signed-in customer, whatever id is sent', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()

    const response = await updateMarketing(client, account, {
      acceptsMarketing: true,
      customerId: other.id,
    })

    response.assertStatus(200)
    await other.refresh()
    assert.isFalse(other.acceptsMarketing)
  })

  test('the change shows in the customer activity without ids', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { account: otherAccount } = await createCustomerAccount()

    await updateMarketing(client, account, { acceptsMarketing: true })

    const response = await client
      .get('/account/activity/list')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)
    response.assertStatus(200)
    const [entry] = response.body().data
    assert.equal(entry.action, 'updated')
    assert.isTrue(entry.changes.after.acceptsMarketing)
    assert.notProperty(entry, 'auditableId')

    const log = await AuditLog.query().where('auditable_id', customer.id).firstOrFail()
    assert.equal(log.customerId, customer.id)

    const other = await client
      .get('/account/activity/list')
      .accept('json')
      .withGuard('customer')
      .loginAs(otherAccount)
    assert.lengthOf(other.body().data, 0)
  })

  test('rejects a value that is not a boolean', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await updateMarketing(client, account, { acceptsMarketing: 'on' })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'acceptsMarketing' }] })
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client
      .put('/account/marketing')
      .json({ acceptsMarketing: true })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})

test.group('Customer marketing: checkout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  async function seedCart() {
    const setup = await seedOrderSetup()
    await enableBankTransfer(setup.market.id)
    const { variant } = await createOrderProduct('Mug', 50)
    return { ...setup, variant }
  }

  function placeBody(
    cart: Awaited<ReturnType<typeof seedCart>>,
    overrides: Body = {}
  ): Body {
    return {
      lineItems: [{ variantId: cart.variant.id, quantity: 1 }],
      countryCode: 'AU',
      province: 'NSW',
      postalCode: '2000',
      shippingRateId: cart.rate.id,
      email: uniqueEmail('checkout'),
      firstName: 'Jane',
      lastName: 'Buyer',
      address1: '1 George Street',
      city: 'Sydney',
      phone: '+61400000000',
      paymentMethod: 'bank_transfer',
      ...overrides,
    }
  }

  test('a guest who ticks the box gets a subscribed profile', async ({ client, assert }) => {
    const cart = await seedCart()
    const body = placeBody(cart, { acceptsMarketing: true })

    const response = await client.post('/checkout').json(body).accept('json').withCsrfToken()

    response.assertStatus(201)
    const customer = await Customer.findByOrFail('email', body.email)
    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'checkout')
  })

  test('a guest who unticks the box is not subscribed', async ({ client, assert }) => {
    const cart = await seedCart()
    const body = placeBody(cart, { acceptsMarketing: false })

    const response = await client.post('/checkout').json(body).accept('json').withCsrfToken()

    response.assertStatus(201)
    const customer = await Customer.findByOrFail('email', body.email)
    assert.isFalse(customer.acceptsMarketing)
    assert.isNull(customer.marketingConsentSource)
  })

  test('unticking never unsubscribes an earlier opt-in', async ({ client, assert }) => {
    const cart = await seedCart()
    const guest = await Customer.create({
      email: uniqueEmail('returning'),
      fullName: 'Returning Guest',
      phone: null,
      isActive: true,
      acceptsMarketing: true,
    })

    const response = await client
      .post('/checkout')
      .json(placeBody(cart, { email: guest.email, acceptsMarketing: false }))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(201)
    await guest.refresh()
    assert.isTrue(guest.acceptsMarketing)
  })

  test('a signed-in customer who ticks the box is subscribed', async ({ client, assert }) => {
    const cart = await seedCart()
    const { account, customer } = await createCustomerAccount({ countryCode: 'AU' })

    const response = await client
      .post('/checkout')
      .json(placeBody(cart, { email: customer.email, acceptsMarketing: true }))
      .accept('json')
      .withCsrfToken()
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(201)
    await customer.refresh()
    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'checkout')
  })

  test('rejects a consent value that is not a boolean', async ({ client }) => {
    const cart = await seedCart()

    const response = await client
      .post('/checkout')
      .json(placeBody(cart, { acceptsMarketing: 'yes' }))
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'acceptsMarketing' }] })
  })
})
