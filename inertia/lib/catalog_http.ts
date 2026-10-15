import type { z } from 'zod'
import { http, HttpError } from './http'
import { CatalogTokenResponseSchema } from './schemas'

/** Matches `CATALOG_TOKEN_ERROR_CODE` in `app/constants/storefront.ts`. */
const CATALOG_TOKEN_ERROR_CODE = 'E_CATALOG_TOKEN'

/** Refresh this long before the server-side expiry, so a request never races it. */
const REFRESH_MARGIN_SECONDS = 60

let cached: { token: string; refreshAt: number } | null = null
let pending: Promise<string> | null = null

async function requestCatalogToken(): Promise<string> {
  const { data } = await http('/store/catalog-token', { schema: CatalogTokenResponseSchema })
  const lifetime = Math.max(data.expiresIn - REFRESH_MARGIN_SECONDS, 0)
  cached = { token: data.token, refreshAt: Date.now() + lifetime * 1000 }
  return data.token
}

/** The session's catalog token, fetched once and shared by concurrent callers. */
function catalogToken(): Promise<string> {
  if (cached && Date.now() < cached.refreshAt) return Promise.resolve(cached.token)
  pending ??= requestCatalogToken().finally(() => {
    pending = null
  })
  return pending
}

/** Fetches the token early (storefront layout mount) so catalog requests don't wait on it. */
export function prefetchCatalogToken(): void {
  if (typeof window === 'undefined') return
  catalogToken().catch((error: unknown) => {
    console.warn('Catalog token could not be prefetched', error)
  })
}

type CatalogRequestOptions<TSchema extends z.ZodType> = {
  schema: TSchema
  signal?: AbortSignal
}

/**
 * GET a storefront catalog route with the session's catalog token. When
 * the server rejects the token (expired, or the session changed), gets a
 * new one and retries once.
 */
export async function catalogHttp<TSchema extends z.ZodType>(
  url: string,
  options: CatalogRequestOptions<TSchema>
): Promise<z.infer<TSchema>> {
  const send = async () =>
    http(url, { ...options, headers: { 'X-Catalog-Token': await catalogToken() } })

  try {
    return await send()
  } catch (error) {
    if (!(error instanceof HttpError) || error.code !== CATALOG_TOKEN_ERROR_CODE) throw error
    cached = null
    return send()
  }
}
