/*
|--------------------------------------------------------------------------
| Live admin notifications
|--------------------------------------------------------------------------
|
| Staff browsers hold a Server-Sent Events stream (Transmit). Events are
| published to Redis by AdminEventService; every web instance subscribes
| here and pushes them to its own connected browsers.
|
*/

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { hasPermission } from '#abilities/main'
import {
  ADMIN_EVENT_CHANNELS,
  ADMIN_EVENTS_REDIS_CHANNEL,
  PRODUCT_IMPORT_CHANNEL_PATTERN,
} from '#constants/admin_events'
import { middleware } from '#start/kernel'
import { parseAdminEventMessage } from '#services/admin_event_message'
import { adminEventsUseRedis } from '#services/admin_event_publisher'

transmit.registerRoutes((route) => {
  route.use([middleware.auth({ guards: ['web'] }), middleware.requireMfa()])
})

for (const [channel, permission] of Object.entries(ADMIN_EVENT_CHANNELS)) {
  transmit.authorize(channel, (ctx) => ctx.bouncer.allows(hasPermission, permission))
}

transmit.authorize<{ userId: string }>(PRODUCT_IMPORT_CHANNEL_PATTERN, async (ctx, { userId }) => {
  if (ctx.auth.use('web').user?.id !== userId) return false
  return ctx.bouncer.allows(hasPermission, 'products.import')
})

// `node ace codegen` boots the web environment in "warmup" mode (no Redis in CI).
if (app.getEnvironment() === 'web' && app.getMode() === 'run' && adminEventsUseRedis()) {
  redis.connection('main').subscribe(
    ADMIN_EVENTS_REDIS_CHANNEL,
    (message) => {
      const event = parseAdminEventMessage(message)
      if (!event) {
        logger.warn({ event: 'admin_event.bad_message' }, 'Ignored a malformed admin event')
        return
      }
      transmit.broadcastExcept(event.channel, event.payload, [])
    },
    {
      onError(error: unknown) {
        logger.error(
          { err: error, event: 'admin_event.subscribe_failed' },
          'Admin events subscription failed'
        )
      },
      onSubscription() {
        logger.info({ channel: ADMIN_EVENTS_REDIS_CHANNEL }, 'Listening for admin events')
      },
    }
  )
}
