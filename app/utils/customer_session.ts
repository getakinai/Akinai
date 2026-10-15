import type { HttpContext } from '@adonisjs/core/http'
import type CustomerAccount from '#models/customer_account'

export const CUSTOMER_SESSION_VERSION_KEY = 'customer_session_version'

export const IMPERSONATION_SESSION_KEY = 'customer_impersonation'

/**
 * Set while a staff User is signed in to the storefront as a customer.
 * `userId` is the staff User; `accountId` the CustomerAccount they signed
 * in as.
 */
export type ImpersonationSession = {
  userId: string
  customerId: string
  accountId: string
  reason: string
  startedAt: string
}

/**
 * Signs the customer in (the guard issues a new session id) and remembers
 * the account's `sessionVersion`, so a later password change signs this
 * session out.
 */
export async function loginCustomer(
  { auth, session }: Pick<HttpContext, 'auth' | 'session'>,
  account: CustomerAccount
): Promise<void> {
  await auth.use('customer').login(account)
  session.put(CUSTOMER_SESSION_VERSION_KEY, account.sessionVersion ?? 0)
}

/**
 * The impersonation stored in the session, or null when there is none or
 * the stored value is malformed.
 */
export function readImpersonation({
  session,
}: Pick<HttpContext, 'session'>): ImpersonationSession | null {
  const value: unknown = session.get(IMPERSONATION_SESSION_KEY, null)
  if (!value || typeof value !== 'object') return null
  const { userId, customerId, accountId, reason, startedAt } = value as Record<string, unknown>
  if (
    typeof userId !== 'string' ||
    typeof customerId !== 'string' ||
    typeof accountId !== 'string' ||
    typeof reason !== 'string' ||
    typeof startedAt !== 'string'
  ) {
    return null
  }
  return { userId, customerId, accountId, reason, startedAt }
}

/**
 * The impersonation, only when it still matches the signed-in staff User
 * and customer account on this request.
 */
export function activeImpersonation(
  ctx: Pick<HttpContext, 'auth' | 'session'>
): ImpersonationSession | null {
  const impersonation = readImpersonation(ctx)
  if (!impersonation) return null
  const staff = ctx.auth.use('web').user
  const account = ctx.auth.use('customer').user
  if (staff?.id !== impersonation.userId || account?.id !== impersonation.accountId) return null
  return impersonation
}
