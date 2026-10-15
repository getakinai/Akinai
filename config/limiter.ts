import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    /**
     * Shared across app instances, so limits hold behind a load balancer.
     */
    redis: stores.redis({ connectionName: 'main', keyPrefix: 'rate_limit' }),

    /**
     * Per-process counters. Tests only.
     */
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
