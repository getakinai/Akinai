import env from '#start/env'

/**
 * Absolute URL on the store's public origin (`APP_URL`), never the request
 * `Host` header. Values that are already absolute (CDN/S3 image URLs) are
 * returned unchanged.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = env.get('APP_URL').replace(/\/+$/, '')
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}
