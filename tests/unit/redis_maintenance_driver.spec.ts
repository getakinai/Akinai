import { test } from '@japa/runner'
import {
  MAINTENANCE_REDIS_KEY,
  RedisMaintenanceDriver,
  type MaintenanceRedisClient,
} from '#utils/redis_maintenance_driver'

function fakeRedis() {
  const store = new Map<string, string>()
  const client: MaintenanceRedisClient = {
    async get(key) {
      return store.get(key) ?? null
    },
    async set(key, value) {
      store.set(key, value)
    },
    async del(key) {
      store.delete(key)
    },
  }
  return { store, client, driver: new RedisMaintenanceDriver(async () => client) }
}

test.group('RedisMaintenanceDriver', () => {
  test('is inactive until activated', async ({ assert }) => {
    const { driver } = fakeRedis()

    assert.isFalse(await driver.active())
    await assert.rejects(() => driver.data(), 'Maintenance mode is not active')
  })

  test('stores the payload under the shared key and clears it', async ({ assert }) => {
    const { store, driver } = fakeRedis()

    await driver.activate({ status: 503, secret: 'let-me-in' })

    assert.isTrue(await driver.active())
    assert.deepEqual(await driver.data(), { status: 503, secret: 'let-me-in' })
    assert.equal(store.get(MAINTENANCE_REDIS_KEY), '{"status":503,"secret":"let-me-in"}')

    await driver.deactivate()

    assert.isFalse(await driver.active())
    assert.isFalse(store.has(MAINTENANCE_REDIS_KEY))
  })

  test('a driver in another container sees the same state', async ({ assert }) => {
    const { client, driver: blue } = fakeRedis()
    const green = new RedisMaintenanceDriver(async () => client)

    await blue.activate({ status: 503 })
    assert.isTrue(await green.active())

    await green.deactivate()
    assert.isFalse(await blue.active())
  })

  test('treats the store as live when Redis cannot be reached', async ({ assert }) => {
    const driver = new RedisMaintenanceDriver(async () => {
      throw new Error('ECONNREFUSED')
    })

    assert.isFalse(await driver.active())
  })
})
