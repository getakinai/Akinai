import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import type { DownPayload } from '@foadonis/maintenance/types'
import maintenanceService from '@foadonis/maintenance/services/main'
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

  test('the maintenance page has a mount point for plugin forms', async ({
    client,
    assert,
    cleanup,
  }) => {
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
