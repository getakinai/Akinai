import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import maintenanceService from '@foadonis/maintenance/services/main'
import AuditLog from '#models/audit_log'
import { createAdminUser } from '#tests/helpers/admin'

const VIEW_URL = '/admin/settings/maintenance/view'
const UPDATE_URL = '/admin/settings/maintenance'

/** Tests use the in-memory driver (config/maintenance.ts). */
function driver() {
  return maintenanceService.driver() as MaintenanceDriver
}

test.group('Admin maintenance mode: view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => () => driver().deactivate())
  group.each.timeout(15_000)

  test('reports that the store is live', async ({ client }) => {
    const user = await createAdminUser(['maintenance.view'])

    const response = await client.get(VIEW_URL).accept('json').withGuard('web').loginAs(user)

    response.assertStatus(200)
    response.assertBody({ data: { active: false } })
  })

  test('reports maintenance turned on from the command line', async ({ client }) => {
    const user = await createAdminUser(['maintenance.view'])
    await driver().activate({ status: 503 })

    const response = await client.get(VIEW_URL).accept('json').withGuard('web').loginAs(user)

    response.assertStatus(200)
    response.assertBody({ data: { active: true } })
  })

  test('staff without maintenance.view get 403', async ({ client }) => {
    const user = await createAdminUser(['store_settings.view'])

    const response = await client.get(VIEW_URL).accept('json').withGuard('web').loginAs(user)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get(VIEW_URL).accept('json')

    response.assertStatus(401)
  })
})

test.group('Admin maintenance mode: update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => () => driver().deactivate())
  group.each.timeout(15_000)

  test('turns maintenance on, so guests get the maintenance page', async ({ client, assert }) => {
    const user = await createAdminUser(['maintenance.view', 'maintenance.edit'])

    const response = await client
      .put(UPDATE_URL)
      .json({ active: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBody({ data: { active: true } })
    assert.isTrue(await driver().active())

    const storefront = await client.get('/store/settings')
    storefront.assertStatus(503)
  })

  test('turns maintenance off, so the storefront is live again', async ({ client, assert }) => {
    const user = await createAdminUser(['maintenance.view', 'maintenance.edit'])
    await driver().activate({ status: 503 })

    const response = await client
      .put(UPDATE_URL)
      .json({ active: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBody({ data: { active: false } })
    assert.isFalse(await driver().active())

    const storefront = await client.get('/store/settings').accept('json')
    storefront.assertStatus(200)
  })

  test('records who changed it as a security event', async ({ client, assert }) => {
    const user = await createAdminUser(['maintenance.view', 'maintenance.edit'])

    for (const active of [true, false]) {
      const response = await client
        .put(UPDATE_URL)
        .json({ active })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)
      response.assertStatus(200)
    }

    const logs = await AuditLog.query()
      .where('user_id', user.id)
      .whereIn('action', ['maintenance_enabled', 'maintenance_disabled'])
    assert.sameMembers(
      logs.map((log) => log.action),
      ['maintenance_enabled', 'maintenance_disabled']
    )
    assert.isTrue(logs.every((log) => log.auditableId === user.id))
  })

  test('the back office stays reachable while maintenance is on', async ({ client }) => {
    const user = await createAdminUser(['maintenance.view', 'maintenance.edit'])
    await driver().activate({ status: 503 })

    const response = await client.get(VIEW_URL).accept('json').withGuard('web').loginAs(user)

    response.assertStatus(200)
    response.assertBody({ data: { active: true } })
  })

  test('rejects values that are not real booleans', async ({ client, assert }) => {
    const user = await createAdminUser(['maintenance.view', 'maintenance.edit'])

    for (const body of [{ active: 'true' }, { active: 1 }, { active: null }, {}]) {
      const response = await client
        .put(UPDATE_URL)
        .json(body)
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'active' }] })
    }
    assert.isFalse(await driver().active())
  })

  test('staff without maintenance.edit get 403', async ({ client, assert }) => {
    const user = await createAdminUser(['maintenance.view', 'store_settings.edit'])

    const response = await client
      .put(UPDATE_URL)
      .json({ active: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
    assert.isFalse(await driver().active())
  })

  test('guests are rejected', async ({ client, assert }) => {
    const response = await client
      .put(UPDATE_URL)
      .json({ active: true })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
    assert.isFalse(await driver().active())
  })
})
