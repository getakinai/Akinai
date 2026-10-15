import { Transmit } from '@adonisjs/transmit-client'
import { readXsrfToken } from '~/lib/http'

let client: Transmit | null = null

function withXsrf(request: Request) {
  const token = readXsrfToken()
  if (token) request.headers.set('X-XSRF-TOKEN', token)
}

/**
 * One Server-Sent Events connection per tab, created on first use in the
 * browser (null during SSR). Subscribe/unsubscribe are POSTs, so they
 * carry the Shield XSRF header like `http()`.
 */
export function transmitClient(): Transmit | null {
  if (typeof window === 'undefined') return null
  client ??= new Transmit({
    baseUrl: window.location.origin,
    beforeSubscribe: withXsrf,
    beforeUnsubscribe: withXsrf,
    maxReconnectAttempts: 20,
  })
  return client
}
