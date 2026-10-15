import env from '#start/env'

/**
 * Application name, read from `APP_NAME`. `start/view.ts` shares it with Edge
 * templates as `appName`. The frontend gets the same value through
 * `import.meta.env.VITE_APP_NAME`, which `vite.config.ts` reads from `.env` at build time.
 */
export const DEFAULT_APP_NAME = 'Storefront'

export const appName = env.get('APP_NAME') || DEFAULT_APP_NAME
