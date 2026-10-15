import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import encryption from '@adonisjs/core/services/encryption'
import { errors } from '@vinejs/vine'
import {
  CATALOG_CURSOR_TTL,
  CATALOG_NONCE_SESSION_KEY,
  CATALOG_TOKEN_TTL_SECONDS,
  STOREFRONT_MAX_PAGE_DEPTH,
} from '#constants/storefront'

const TOKEN_PURPOSE = 'storefront-catalog-token'
const CURSOR_PURPOSE = 'storefront-catalog-cursor'

type Session = HttpContext['session']

type TokenPayload = { n: string }
type CursorPayload = { n: string; s: string; p: number }

export type CatalogToken = { token: string; expiresIn: number }

export type CatalogTokenCheck = 'valid' | 'missing' | 'invalid'

function sameNonce(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function cursorError(): never {
  throw new errors.E_VALIDATION_ERROR([
    { field: 'cursor', message: 'This list has expired. Please reload the page.', rule: 'cursor' },
  ])
}

/**
 * Short-lived catalog tokens and opaque page cursors for the storefront's
 * public catalog JSON routes. Both are encrypted and signed with `APP_KEY`,
 * expire on their own, and are bound to a random nonce kept in the
 * visitor's session, so they can't be built by hand or reused from another
 * session.
 */
export default class StorefrontCatalogTokenService {
  /** The session's catalog nonce, created on first use (which also persists a guest's session). */
  protected nonceFor(session: Session): string {
    const existing = session.get(CATALOG_NONCE_SESSION_KEY)
    if (typeof existing === 'string' && existing.length > 0) return existing
    const nonce = randomBytes(16).toString('base64url')
    session.put(CATALOG_NONCE_SESSION_KEY, nonce)
    return nonce
  }

  /** The nonce catalog rate limits are keyed by, or null when the session has none yet. */
  sessionKey(session: Session): string | null {
    const nonce = session.get(CATALOG_NONCE_SESSION_KEY)
    return typeof nonce === 'string' && nonce.length > 0 ? nonce : null
  }

  issue(session: Session): CatalogToken {
    return this.tokenFor(this.nonceFor(session))
  }

  /** A token for a known session nonce. */
  tokenFor(nonce: string): CatalogToken {
    const payload: TokenPayload = { n: nonce }
    const token = String(
      encryption.encrypt(payload, {
        expiresIn: `${CATALOG_TOKEN_TTL_SECONDS}s`,
        purpose: TOKEN_PURPOSE,
      })
    )
    return { token, expiresIn: CATALOG_TOKEN_TTL_SECONDS }
  }

  check(session: Session, token: string | undefined): CatalogTokenCheck {
    if (!token) return 'missing'
    const payload = encryption.decrypt<TokenPayload>(token, TOKEN_PURPOSE)
    return payload && sameNonce(payload.n, this.sessionKey(session)) ? 'valid' : 'invalid'
  }

  /**
   * A stable fingerprint of what a list shows (slug, sort, filters), so a
   * cursor only works for the list it was issued for.
   */
  scope(parts: Record<string, unknown>): string {
    const sorted = Object.keys(parts)
      .sort()
      .map((key) => [key, parts[key]])
    return createHash('sha256').update(JSON.stringify(sorted)).digest('base64url')
  }

  /** The page a cursor points at; page 1 when there is no cursor. */
  pageFrom(session: Session, scope: string, cursor: string | undefined): number {
    if (!cursor) return 1
    const payload = encryption.decrypt<CursorPayload>(cursor, CURSOR_PURPOSE)
    if (
      !payload ||
      !sameNonce(payload.n, this.sessionKey(session)) ||
      payload.s !== scope ||
      !Number.isInteger(payload.p) ||
      payload.p < 2 ||
      payload.p > STOREFRONT_MAX_PAGE_DEPTH
    ) {
      cursorError()
    }
    return payload.p
  }

  /** The cursor for the page after `page`, or null on the last page or at the depth cap. */
  nextCursor(session: Session, scope: string, page: number, lastPage: number): string | null {
    const next = page + 1
    if (next > lastPage || next > STOREFRONT_MAX_PAGE_DEPTH) return null
    const payload: CursorPayload = { n: this.nonceFor(session), s: scope, p: next }
    return String(
      encryption.encrypt(payload, { expiresIn: CATALOG_CURSOR_TTL, purpose: CURSOR_PURPOSE })
    )
  }
}
