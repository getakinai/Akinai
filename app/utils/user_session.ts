import type { HttpContext } from '@adonisjs/core/http'
import type User from '#models/user'
import { MFA_PENDING_LOGIN_SESSION_KEY, USER_SESSION_VERSION_KEY } from '#constants/user_mfa'

/**
 * Signs the staff User in (the guard issues a new session id) and
 * remembers their `sessionVersion`, so a later password change or MFA
 * removal signs this session out.
 */
export async function loginUser(
  { auth, session }: Pick<HttpContext, 'auth' | 'session'>,
  user: User
): Promise<void> {
  session.forget(MFA_PENDING_LOGIN_SESSION_KEY)
  await auth.use('web').login(user)
  session.put(USER_SESSION_VERSION_KEY, user.sessionVersion ?? 0)
}

/**
 * Signs the staff User out and rotates the session id, so a copied
 * session cookie can't be reused. A customer signed in on the same
 * browser stays signed in.
 */
export async function logoutUser({
  auth,
  session,
}: Pick<HttpContext, 'auth' | 'session'>): Promise<void> {
  await auth.use('web').logout()
  session.forget(USER_SESSION_VERSION_KEY)
  session.regenerate()
}
