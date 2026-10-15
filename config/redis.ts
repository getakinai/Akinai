import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'
import { InferConnections } from '@adonisjs/redis/types'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    /**
     * Used by the rate limiter (`config/limiter.ts`).
     */
    main: {
      host: env.get('REDIS_HOST', '127.0.0.1'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD')?.release(),
      db: 0,
      keyPrefix: '',
      /**
       * Never give up: a closed client stays closed until the app restarts,
       * so Redis starting late or restarting would break checkout and login.
       */
      retryStrategy(times) {
        return Math.min(times * 200, 2000)
      },
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
