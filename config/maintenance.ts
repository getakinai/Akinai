import app from '@adonisjs/core/services/app'
import { defineConfig } from '@foadonis/maintenance'
import { MemoryMaintenanceDriver } from '#utils/memory_maintenance_driver'
import { RedisMaintenanceDriver } from '#utils/redis_maintenance_driver'

/**
 * Redis, so `node ace down` reaches every app container (blue and green)
 * and survives deploys. Tests keep the state in memory.
 */
export default defineConfig({
  default: app.inTest ? 'memory' : 'redis',
  drivers: {
    redis: () => new RedisMaintenanceDriver(),
    memory: () => new MemoryMaintenanceDriver(),
  },
})
