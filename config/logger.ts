import env from '#start/env'
import { appName } from '#config/brand'
import app from '@adonisjs/core/services/app'
import { defineConfig, syncDestination, targets } from '@adonisjs/core/logger'

const SENSITIVE_KEYS = [
  'password',
  'passwordConfirmation',
  'currentPassword',
  'passwordHash',
  'token',
  'setupToken',
  'accessToken',
  'refreshToken',
  'secret',
  'secretKey',
  'webhookSecret',
  'authenticationCode',
  'authCodeEncrypted',
  'mfaSecret',
  'recoveryCodes',
  'mfaRecoveryCodes',
  'authorization',
  'cookie',
  'set-cookie',
  'x-xsrf-token',
  'x-catalog-token',
  'catalogToken',
  'stripe-signature',
]

/** Each key at the top level and one or two levels deep (`body.password`, `req.headers.cookie`). */
export const LOG_REDACT_PATHS = SENSITIVE_KEYS.flatMap((key) => {
  const segment = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `["${key}"]`
  const join = (prefix: string) =>
    segment.startsWith('[') ? `${prefix}${segment}` : `${prefix}.${segment}`
  return [segment, join('*'), join('*.*')]
})

const loggerConfig = defineConfig({
  /**
   * Default logger name used by ctx.logger and app logger calls.
   */
  default: 'app',

  loggers: {
    app: {
      /**
       * Toggle this logger on/off.
       */
      enabled: true,

      /**
       * Logger name shown in log records.
       */
      name: appName,

      /**
       * Minimum level to output (trace, debug, info, warn, error, fatal).
       */
      level: env.get('LOG_LEVEL'),

      /**
       * Never write credentials or secrets to the logs, even when a whole
       * request body, headers object or model is logged by mistake.
       */
      redact: {
        paths: LOG_REDACT_PATHS,
        censor: '[redacted]',
      },

      /**
       * Use sync destination in non-production for immediate flush.
       */
      destination: !app.inProduction ? await syncDestination() : undefined,

      /**
       * Configure where logs are written.
       */
      transport: {
        targets: [targets.file({ destination: 1 })],
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
