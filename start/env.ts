/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'
import { missingS3Settings } from '#utils/drive_disk_rules'

const env = await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_NAME: Env.schema.string.optional(),
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.secret.optional(),
  DB_DATABASE: Env.schema.string(),
  DB_SSL: Env.schema.boolean.optional(),
  DB_SSL_REJECT_UNAUTHORIZED: Env.schema.boolean.optional(),
  DB_SSL_CA_PATH: Env.schema.string.optional(),

  // Seeders
  SEED_ADMIN_PASSWORD: Env.schema.string.optional(),

  // Google Places (address autocomplete). Leave unset to disable suggestions.
  GOOGLE_AUTOCOMPLETE_ADDRESS_API_KEY: Env.schema.secret.optional(),

  // Customer social sign-in (@adonisjs/ally). Redirect URLs default to APP_URL.
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.secret.optional(),
  GOOGLE_CLIENT_REDIRECT_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  MICROSOFT_CLIENT_ID: Env.schema.string.optional(),
  MICROSOFT_CLIENT_SECRET: Env.schema.secret.optional(),
  MICROSOFT_CLIENT_REDIRECT_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  // Product search (Magnify). `memory` keeps the index in-process (tests only).
  SEARCH_ENGINE: Env.schema.enum.optional(['typesense', 'memory'] as const),
  TYPESENSE_NODE_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  TYPESENSE_API_KEY: Env.schema.secret.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  // Ignored in production, which always uses `s3` (see #utils/drive_disk_rules).
  DRIVE_DISK: Env.schema.enum.optional(['fs', 's3'] as const),
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.secret.optional(),
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  S3_ENDPOINT: Env.schema.string.optional({ format: 'url', tld: false }),
  CDN_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  // Private uploads (e.g. payment proofs), served only through authenticated routes.
  // Defaults to `fsPrivate` when DRIVE_DISK is `fs`, `s3Private` otherwise.
  // Production always uses `s3Private`.
  DRIVE_PRIVATE_DISK: Env.schema.enum.optional(['fsPrivate', 's3Private'] as const),
  S3_PRIVATE_BUCKET: Env.schema.string.optional(),

  // Redis (rate limiter store)
  REDIS_HOST: Env.schema.string.optional({ format: 'host' }),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.secret.optional(),

  // Rate limiting. `memory` keeps counters in-process (tests only).
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),

  // Live admin notifications. `redis` shares them across app instances
  // through Redis pub/sub; `memory` pushes in-process only (tests).
  ADMIN_EVENTS_TRANSPORT: Env.schema.enum.optional(['redis', 'memory'] as const),

  // Google reCAPTCHA v3 on public forms (login, signup, checkout)
  RECAPTCHA_ENABLED: Env.schema.boolean.optional(),
  RECAPTCHA_SECRET_KEY: Env.schema.secret.optional(),
  RECAPTCHA_MIN_SCORE: Env.schema.number.optional(),
  VITE_RECAPTCHA_SITE_KEY: Env.schema.string.optional(),

  // Mail (@adonisjs/mail). Mailpit locally, any SMTP provider in production.
  MAIL_MAILER: Env.schema.enum(['smtp'] as const),
  MAIL_FROM_NAME: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: 'email' }),
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),
  SMTP_SECURE: Env.schema.boolean.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.secret.optional(),

  // Reject passwords found in known breaches (HaveIBeenPwned range API)
  PWNED_PASSWORDS_ENABLED: Env.schema.boolean.optional(),

  // Send HSTS with includeSubDomains (production only). Defaults to true.
  HSTS_INCLUDE_SUBDOMAINS: Env.schema.boolean.optional(),

  // Staff must turn on two-step verification before using the back office.
  REQUIRE_STAFF_MFA: Env.schema.boolean.optional(),

  // One-time token for /admin/setup, which creates the first admin while no
  // staff User exists. Setup stays disabled unless this is set.
  SETUP_TOKEN: Env.schema.secret.optional(),
})

/**
 * In-process stores lose counters and sessions on restart and can't be
 * shared or revoked across instances, so production must use shared ones.
 * Uploads always go to S3 in production, so its settings are required.
 */
if (env.get('NODE_ENV') === 'production') {
  const invalid: string[] = []
  if (env.get('LIMITER_STORE') === 'memory') invalid.push('LIMITER_STORE must be "redis"')
  if (env.get('SESSION_DRIVER') !== 'database') invalid.push('SESSION_DRIVER must be "database"')
  if (env.get('ADMIN_EVENTS_TRANSPORT') === 'memory') {
    invalid.push('ADMIN_EVENTS_TRANSPORT must be "redis"')
  }
  const missingS3 = missingS3Settings({
    AWS_ACCESS_KEY_ID: env.get('AWS_ACCESS_KEY_ID'),
    AWS_SECRET_ACCESS_KEY: env.get('AWS_SECRET_ACCESS_KEY')?.release(),
    AWS_REGION: env.get('AWS_REGION'),
    S3_BUCKET: env.get('S3_BUCKET'),
  })
  if (missingS3.length > 0) {
    invalid.push(`uploads use S3 in production; set ${missingS3.join(', ')}`)
  }
  if (invalid.length > 0) {
    throw new Error(`Invalid production environment: ${invalid.join('; ')}`)
  }
}

export default env
