import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import maintenanceService from '@foadonis/maintenance/services/main'
import AuditLog from '#models/audit_log'
import MaintenanceService from '#services/maintenance_service'
import { createAdminUser } from '#tests/helpers/admin'

/** Tests use the in-memory driver (config/maintenance.ts). */
function driver() {
  return maintenanceService.driver() as MaintenanceDriver
}

function maintenanceLogs(userId: string) {
  return AuditLog.query()
    .where('user_id', userId)
    .whereIn('action', ['maintenance_enabled', 'maintenance_disabled'])
}

test.group('MaintenanceService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => () => driver().deactivate())
  group.each.timeout(15_000)

  test('status reports whether maintenance mode is on', async ({ assert }) => {
    const service = await app.container.make(MaintenanceService)

    assert.deepEqual(await service.status(), { active: false })
    await driver().activate({ status: 503 })
    assert.deepEqual(await service.status(), { active: true })
  })

  test('turning it on writes the default 503 payload and records the event', async ({ assert }) => {
    const service = await app.container.make(MaintenanceService)
    const user = await createAdminUser('admin')

    const result = await service.setActive(true, user, '127.0.0.1')

    assert.deepEqual(result, { active: true })
    assert.isTrue(await driver().active())
    assert.deepEqual(await driver().data(), { status: 503 })
    const logs = await maintenanceLogs(user.id)
    assert.lengthOf(logs, 1)
    assert.equal(logs[0].action, 'maintenance_enabled')
    assert.equal(logs[0].ipAddress, '127.0.0.1')
  })

  test('turning it off clears the state and records the event', async ({ assert }) => {
    const service = await app.container.make(MaintenanceService)
    const user = await createAdminUser('admin')
    await driver().activate({ status: 503 })

    const result = await service.setActive(false, user, null)

    assert.deepEqual(result, { active: false })
    assert.isFalse(await driver().active())
    const logs = await maintenanceLogs(user.id)
    assert.lengthOf(logs, 1)
    assert.equal(logs[0].action, 'maintenance_disabled')
  })

  test('does nothing when the store is already in the requested state', async ({ assert }) => {
    const service = await app.container.make(MaintenanceService)
    const user = await createAdminUser('admin')

    assert.deepEqual(await service.setActive(false, user, null), { active: false })
    await service.setActive(true, user, null)
    assert.deepEqual(await service.setActive(true, user, null), { active: true })

    const logs = await maintenanceLogs(user.id)
    assert.deepEqual(
      logs.map((log) => log.action),
      ['maintenance_enabled']
    )
  })

  test('keeps a payload written by `node ace down` when asked to turn it on again', async ({
    assert,
  }) => {
    const service = await app.container.make(MaintenanceService)
    const user = await createAdminUser('admin')
    await driver().activate({ status: 503, secret: 'from-cli' })

    await service.setActive(true, user, null)

    assert.deepEqual(await driver().data(), { status: 503, secret: 'from-cli' })
  })
})
