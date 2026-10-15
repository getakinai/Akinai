import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import type { DownPayload } from '@foadonis/maintenance/types'
import maintenanceService from '@foadonis/maintenance/services/main'
import Customer from '#models/customer'
import NewsletterSubscriber from '#models/newsletter_subscriber'
import RecaptchaService from '#services/recaptcha_service'
import type { RecaptchaAction } from '#utils/verify_recaptcha'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount } from '#tests/helpers/customers'

const STOREFRONT_URL = '/store/settings'

/**
 * Tests use the in-memory driver (config/maintenance.ts), so this never
 * touches the Redis key the dev server reads.
 */
async function enableMaintenance(payload: Partial<DownPayload> = {}) {
  const driver = maintenanceService.driver() as MaintenanceDriver
  await driver.activate({ status: 503, ...payload })
  return () => driver.deactivate()
}

test.group('Maintenance mode', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('serves the storefront when maintenance is off', async ({ client }) => {
    const response = await client.get(STOREFRONT_URL).accept('json')
    response.assertStatus(200)
  })

  test('shows the maintenance page to guests', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance({ retry: 120 }))

    const response = await client.get(STOREFRONT_URL)

    response.assertStatus(503)
    response.assertHeader('retry-after', '120')
  })

  test('the maintenance page mounts the newsletter form', async ({ client, assert, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await client.get(STOREFRONT_URL)

    response.assertStatus(503)
    assert.include(response.text(), '<div id="newsletter-root"></div>')
  })

  test('styles the maintenance page with the CSP nonce', async ({ client, assert, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await client.get(STOREFRONT_URL)

    response.assertStatus(503)
    const csp = String(response.header('content-security-policy'))
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
    assert.isString(nonce)
    assert.include(response.text(), `<style nonce="${nonce}">`)
  })

  test('shows the maintenance page to signed-in customers', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())
    const { account } = await createCustomerAccount()

    const response = await client.get(STOREFRONT_URL).withGuard('customer').loginAs(account)

    response.assertStatus(503)
  })

  test('lets a signed-in staff user see the storefront', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())
    const user = await createAdminUser([])

    const response = await client.get(STOREFRONT_URL).accept('json').withGuard('web').loginAs(user)

    response.assertStatus(200)
  })

  test('flags maintenance in the storefront session for staff', async ({
    client,
    assert,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    const user = await createAdminUser([])

    const response = await client
      .get('/store/session')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(response.body().data, {
      signedIn: false,
      maintenance: true,
      impersonation: null,
    })
  })

  test('does not flag maintenance in the storefront session when it is off', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser([])

    const response = await client
      .get('/store/session')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(response.body().data, {
      signedIn: false,
      maintenance: false,
      impersonation: null,
    })
  })

  test('shows the maintenance page to a staff session from before a password change', async ({
    client,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    const user = await createAdminUser([])
    await user.merge({ sessionVersion: 1 }).save()

    const response = await client
      .get(STOREFRONT_URL)
      .withGuard('web')
      .loginAs(user)
      .withSession({ user_session_version: 0 })

    response.assertStatus(503)
  })

  test('keeps the back office reachable for guests', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await client.get('/admin/me').accept('json')

    response.assertStatus(401)
  })

  test('keeps robots.txt reachable for crawlers', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await client.get('/robots.txt')

    response.assertStatus(200)
    response.assertTextIncludes('User-agent: GPTBot')
  })

  test('sends the custom template when one was given', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance({ template: 'Back soon' }))

    const response = await client.get(STOREFRONT_URL)

    response.assertStatus(503)
    response.assertTextIncludes('Back soon')
  })

  test('redirects guests when a redirect was given', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance({ redirect: '/admin/login' }))

    const response = await client.get(STOREFRONT_URL).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/login')
  })

  test('the secret URL sets the bypass cookie', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance({ secret: 'let-me-in' }))

    const response = await client.get('/let-me-in').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertCookie('adonis_maintenance')
  })

  test('a valid bypass cookie lets a guest through', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance({ secret: 'let-me-in' }))

    const response = await client
      .get(STOREFRONT_URL)
      .accept('json')
      .withCookie('adonis_maintenance', await hash.make('let-me-in'))

    response.assertStatus(200)
  })
})

const MAINTENANCE_NEWSLETTER_URL = '/maintenance/newsletter'

let sequence = 0

function uniqueEmail() {
  sequence++
  return `waiting-${sequence}-${Date.now()}@example.com`
}

function subscribe(client: ApiClient, url: string, body: Record<string, unknown>, token?: string) {
  const request = client.post(url).json(body).accept('json').withCsrfToken()
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

test.group('Maintenance mode: newsletter signup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  test('guests can subscribe while the store is down', async ({ client, assert, cleanup }) => {
    cleanup(await enableMaintenance())
    const email = uniqueEmail()

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email })

    response.assertStatus(202)
    response.assertBody({ data: { subscribed: true } })
    const subscriber = await NewsletterSubscriber.findByOrFail('email', email)
    assert.isTrue(subscriber.isSubscribed)
    assert.equal(subscriber.source, 'maintenance')
    assert.isNull(await Customer.findBy('email', email))
  })

  test('an existing customer is opted in while the store is down', async ({
    client,
    assert,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    const { customer } = await createCustomerAccount()

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {
      email: customer.email,
    })

    response.assertStatus(202)
    await customer.refresh()
    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'newsletter')
    const subscriber = await NewsletterSubscriber.findByOrFail('email', customer.email)
    assert.equal(subscriber.source, 'maintenance')
  })

  test('the footer newsletter route still shows the maintenance page', async ({
    client,
    assert,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    const email = uniqueEmail()

    const response = await subscribe(client, '/newsletter', { email })

    response.assertStatus(503)
    assert.isNull(await NewsletterSubscriber.findBy('email', email))
  })

  test('also works when the store is live', async ({ client }) => {
    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {
      email: uniqueEmail(),
    })

    response.assertStatus(202)
  })

  test('rejects throwaway email domains', async ({ client, assert, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {
      email: 'temp@mailinator.com',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email', rule: 'notDisposableEmail' }] })
    assert.isNull(await NewsletterSubscriber.findBy('email', 'temp@mailinator.com'))
  })

  test('rejects an invalid or missing email', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())

    const invalid = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email: 'nope' })
    const missing = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {})
    const notString = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email: 123 })

    invalid.assertStatus(422)
    missing.assertStatus(422)
    notString.assertStatus(422)
  })

  test('requires a CSRF token', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())

    const response = await client
      .post(MAINTENANCE_NEWSLETTER_URL)
      .json({ email: uniqueEmail() })
      .accept('json')

    response.assertStatus(403)
  })

  test('is rate limited per IP', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {
        email: uniqueEmail(),
      })
      response.assertStatus(202)
    }

    const blocked = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email: uniqueEmail() })
    blocked.assertStatus(429)
  })
})

test.group('Maintenance mode: newsletter reCAPTCHA', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.setup(() => () => app.container.restore(RecaptchaService))
  group.each.timeout(20_000)

  test('a failed check is rejected before anything is saved', async ({
    client,
    assert,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    app.container.swap(RecaptchaService, () => new FakeRecaptcha(false))
    const email = uniqueEmail()

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email }, 'token')

    response.assertStatus(400)
    assert.property(response.body(), 'error')
    assert.isNull(await NewsletterSubscriber.findBy('email', email))
  })

  test('a missing token is rejected', async ({ client, cleanup }) => {
    cleanup(await enableMaintenance())
    app.container.swap(RecaptchaService, () => new FakeRecaptcha(true))

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, {
      email: uniqueEmail(),
    })

    response.assertStatus(400)
  })

  test('a passing check subscribes, using the maintenance action', async ({
    client,
    assert,
    cleanup,
  }) => {
    cleanup(await enableMaintenance())
    const fake = new FakeRecaptcha(true)
    app.container.swap(RecaptchaService, () => fake)
    const email = uniqueEmail()

    const response = await subscribe(client, MAINTENANCE_NEWSLETTER_URL, { email }, 'token')

    response.assertStatus(202)
    assert.deepEqual(fake.calls, [{ token: 'token', action: 'maintenance_newsletter' }])
    assert.exists(await NewsletterSubscriber.findBy('email', email))
  })
})
