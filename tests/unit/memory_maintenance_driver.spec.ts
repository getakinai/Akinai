import { test } from '@japa/runner'
import { MemoryMaintenanceDriver } from '#utils/memory_maintenance_driver'

test.group('MemoryMaintenanceDriver', () => {
  test('starts inactive', async ({ assert }) => {
    const driver = new MemoryMaintenanceDriver()

    assert.isFalse(await driver.active())
    await assert.rejects(() => driver.data(), 'Maintenance mode is not active')
  })

  test('activates with the payload and deactivates', async ({ assert }) => {
    const driver = new MemoryMaintenanceDriver()

    await driver.activate({ status: 503, retry: 60 })
    assert.isTrue(await driver.active())
    assert.deepEqual(await driver.data(), { status: 503, retry: 60 })

    await driver.deactivate()
    assert.isFalse(await driver.active())
  })
})
