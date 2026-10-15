import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import env from '#start/env'
import { ADMIN_EVENT_PUBLISH_TIMEOUT_MS, ADMIN_EVENTS_REDIS_CHANNEL } from '#constants/admin_events'
import { encodeAdminEventMessage, type AdminEventMessage } from '#services/admin_event_message'

export function adminEventsUseRedis() {
  if (env.get('NODE_ENV') === 'test') {
    return false
  }
  return (env.get('ADMIN_EVENTS_TRANSPORT') ?? 'redis') === 'redis'
}

/** Rejects when `promise` hasn't settled within `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Sends an admin event to every app instance. With Redis it publishes to
 * the shared channel (each instance's subscriber in `start/transmit.ts`
 * pushes it to its browsers); otherwise it pushes in-process.
 * Throws when Redis is unreachable so the event can be marked failed.
 */
export default class AdminEventPublisher {
  async publish(message: AdminEventMessage): Promise<void> {
    if (!adminEventsUseRedis()) {
      transmit.broadcastExcept(message.channel, message.payload, [])
      return
    }
    await withTimeout(
      redis.publish(ADMIN_EVENTS_REDIS_CHANNEL, encodeAdminEventMessage(message)),
      ADMIN_EVENT_PUBLISH_TIMEOUT_MS
    )
  }
}
