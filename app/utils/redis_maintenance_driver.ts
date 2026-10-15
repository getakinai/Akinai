import logger from '@adonisjs/core/services/logger'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import type { DownPayload } from '@foadonis/maintenance/types'

export const MAINTENANCE_REDIS_KEY = 'maintenance:down'

export type MaintenanceRedisClient = {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<unknown>
  del(key: string): Promise<unknown>
}

async function defaultClient(): Promise<MaintenanceRedisClient> {
  const { default: redis } = await import('@adonisjs/redis/services/main')
  return redis
}

/**
 * Keeps maintenance state in Redis so every app container shares it. The
 * package's file driver writes `tmp/down.lock` inside one container, so
 * with blue/green slots `node ace down` only reached one slot, and the
 * next deploy started a fresh container that was live again.
 */
export class RedisMaintenanceDriver implements MaintenanceDriver {
  constructor(private resolveClient: () => Promise<MaintenanceRedisClient> = defaultClient) {}

  async activate(data: DownPayload) {
    const client = await this.resolveClient()
    await client.set(MAINTENANCE_REDIS_KEY, JSON.stringify(data))
  }

  async deactivate() {
    const client = await this.resolveClient()
    await client.del(MAINTENANCE_REDIS_KEY)
  }

  /**
   * Runs on every request. If Redis can't be reached the store stays live
   * rather than sending every visitor an error page.
   */
  async active() {
    try {
      const client = await this.resolveClient()
      return (await client.get(MAINTENANCE_REDIS_KEY)) !== null
    } catch (error) {
      logger.warn({ err: error, event: 'maintenance.check_failed' }, 'Maintenance check failed')
      return false
    }
  }

  async data(): Promise<DownPayload> {
    const client = await this.resolveClient()
    const raw = await client.get(MAINTENANCE_REDIS_KEY)
    if (raw === null) {
      throw new Error('Maintenance mode is not active')
    }
    return JSON.parse(raw) as DownPayload
  }
}
