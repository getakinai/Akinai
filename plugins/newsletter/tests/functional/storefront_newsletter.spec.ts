import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import RecaptchaService from '#services/recaptcha_service'
import type { RecaptchaAction } from '#utils/verify_recaptcha'
import { createCustomerAccount } from '#tests/helpers/customers'
import NewsletterSubscriber from '../../server/models/newsletter_subscriber.js'

let sequence = 0

function uniqueEmail() {
  sequence++
  return `reader-${sequence}-${Date.now()}@example.com`
}

function subscribe(client: ApiClient, body: Record<string, unknown>, token?: string) {
  const request = client.post('/newsletter').json(body).accept('json').withCsrfToken()
  return token ? request.header('X-Recaptcha-Token', token) : request
}

class FakeRecaptcha extends RecaptchaService {
  calls: { token: string; action: RecaptchaAction }[] = []

  constructor(protected passes: boolean) {
    super()
  }

  isEnabled() {
    return true
  }

  async verify(token: string, action: RecaptchaAction) {
    this.calls.push({ token, action })
    return this.passes
  }
}

test.group('Storefront newsletter', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  test('an unknown email becomes a footer subscriber, not a customer', async ({
    client,
    assert,
  }) => {
    const email = uniqueEmail()

    const response = await subscribe(client, { email })

    response.assertStatus(202)
    response.assertBody({ data: { subscribed: true } })
    const subscriber = await NewsletterSubscriber.findByOrFail('email', email)
    assert.isTrue(subscriber.isSubscribed)
    assert.equal(subscriber.source, 'footer')
    assert.isNotNull(subscriber.subscribedAt)
    assert.isNull(subscriber.unsubscribedAt)
    assert.isNull(await Customer.findBy('email', email))
    assert.isNull(await CustomerAccount.findBy('email', email))
  })

  test('stores the email trimmed and lowercased', async ({ client, assert }) => {
    const email = uniqueEmail()

    const response = await subscribe(client, { email: `  ${email.toUpperCase()} ` })

    response.assertStatus(202)
    assert.exists(await NewsletterSubscriber.findBy('email', email))
  })

  test('an existing customer is opted in and added to the newsletter list', async ({
    client,
    assert,
  }) => {
    const { customer } = await createCustomerAccount()

    const response = await subscribe(client, { email: customer.email })

    response.assertStatus(202)
    response.assertBody({ data: { subscribed: true } })
    await customer.refresh()
    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'newsletter')
    assert.isNotNull(customer.marketingConsentAt)
    assert.exists(await NewsletterSubscriber.findBy('email', customer.email))
    assert.lengthOf(await Customer.query().where('email', customer.email), 1)
  })

  test('an already opted-in customer keeps their original consent', async ({ client, assert }) => {
    const { customer } = await createCustomerAccount()
    await customer.merge({ acceptsMarketing: true, marketingConsentSource: 'signup' }).save()

    const response = await subscribe(client, { email: customer.email })

    response.assertStatus(202)
    await customer.refresh()
    assert.equal(customer.marketingConsentSource, 'signup')
    assert.exists(await NewsletterSubscriber.findBy('email', customer.email))
  })

  test('an archived customer is not opted in', async ({ client, assert }) => {
    const { customer } = await createCustomerAccount()
    await customer.merge({ isActive: false }).save()

    const response = await subscribe(client, { email: customer.email })

    response.assertStatus(202)
    response.assertBody({ data: { subscribed: true } })
    await customer.refresh()
    assert.isFalse(customer.acceptsMarketing)
  })

  test('an already subscribed email keeps its original sign-up', async ({ client, assert }) => {
    const email = uniqueEmail()
    const subscribedAt = DateTime.now().minus({ days: 30 }).startOf('second')
    await NewsletterSubscriber.create({
      email,
      source: 'maintenance',
      isSubscribed: true,
      subscribedAt,
      unsubscribedAt: null,
    })

    const response = await subscribe(client, { email })

    response.assertStatus(202)
    response.assertBody({ data: { subscribed: true } })
    const subscriber = await NewsletterSubscriber.findByOrFail('email', email)
    assert.equal(subscriber.source, 'maintenance')
    assert.equal(subscriber.subscribedAt.toMillis(), subscribedAt.toMillis())
    assert.lengthOf(await NewsletterSubscriber.query().where('email', email), 1)
  })

  test('an unsubscribed email is resubscribed', async ({ client, assert }) => {
    const email = uniqueEmail()
    await NewsletterSubscriber.create({
      email,
      source: 'maintenance',
      isSubscribed: false,
      subscribedAt: DateTime.now().minus({ days: 30 }),
      unsubscribedAt: DateTime.now().minus({ days: 1 }),
    })

    const response = await subscribe(client, { email })

    response.assertStatus(202)
    const subscriber = await NewsletterSubscriber.findByOrFail('email', email)
    assert.isTrue(subscriber.isSubscribed)
    assert.equal(subscriber.source, 'footer')
    assert.isNull(subscriber.unsubscribedAt)
  })

  test('rejects an invalid or missing email', async ({ client }) => {
    const invalid = await subscribe(client, { email: 'not-an-email' })
    const missing = await subscribe(client, {})

    invalid.assertStatus(422)
    invalid.assertBodyContains({ errors: [{ field: 'email' }] })
    missing.assertStatus(422)
  })

  test('rejects throwaway email domains', async ({ client, assert }) => {
    const response = await subscribe(client, { email: 'temp@mailinator.com' })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email', rule: 'notDisposableEmail' }] })
    assert.isNull(await NewsletterSubscriber.findBy('email', 'temp@mailinator.com'))
  })

  test('rejects an email that is not a string', async ({ client }) => {
    const response = await subscribe(client, { email: 12345 })

    response.assertStatus(422)
  })

  test('is rate limited per email', async ({ client }) => {
    const email = uniqueEmail()
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await subscribe(client, { email })
      response.assertStatus(202)
    }

    const blocked = await subscribe(client, { email })
    blocked.assertStatus(429)
  })

  test('is rate limited per IP', async ({ client }) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await subscribe(client, { email: uniqueEmail() })
      response.assertStatus(202)
    }

    const blocked = await subscribe(client, { email: uniqueEmail() })
    blocked.assertStatus(429)
  })
})

test.group('Storefront newsletter: reCAPTCHA', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.setup(() => () => app.container.restore(RecaptchaService))
  group.each.timeout(20_000)

  test('a failed check is rejected before anything is saved', async ({ client, assert }) => {
    app.container.swap(RecaptchaService, () => new FakeRecaptcha(false))
    const email = uniqueEmail()

    const response = await subscribe(client, { email }, 'token')

    response.assertStatus(400)
    assert.property(response.body(), 'error')
    assert.isNull(await NewsletterSubscriber.findBy('email', email))
  })

  test('a missing token is rejected', async ({ client }) => {
    app.container.swap(RecaptchaService, () => new FakeRecaptcha(true))

    const response = await subscribe(client, { email: uniqueEmail() })

    response.assertStatus(400)
  })

  test('a passing check subscribes, using the newsletter action', async ({ client, assert }) => {
    const fake = new FakeRecaptcha(true)
    app.container.swap(RecaptchaService, () => fake)
    const email = uniqueEmail()

    const response = await subscribe(client, { email }, 'token')

    response.assertStatus(202)
    assert.deepEqual(fake.calls, [{ token: 'token', action: 'customer_newsletter' }])
    assert.exists(await NewsletterSubscriber.findBy('email', email))
  })
})
