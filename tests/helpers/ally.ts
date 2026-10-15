import app from '@adonisjs/core/services/app'
import { configProvider } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { AllyManager } from '@adonisjs/ally'
import type { SocialProfile } from '#services/customer_social_auth_service'

export type FakeCallback = { profile?: SocialProfile; error?: 'access_denied' | 'state_mismatch' }

let sequence = 0

/** A verified Google/Microsoft profile with a unique id and email. */
export function socialProfile(
  overrides: Partial<Omit<SocialProfile, 'email'>> & { email?: string } = {}
): SocialProfile & { email: string } {
  sequence++
  return {
    id: `provider-user-${sequence}-${Date.now()}`,
    email: `social-${sequence}-${Date.now()}@example.com`,
    name: `Social Shopper ${sequence}`,
    emailVerificationState: 'verified',
    ...overrides,
  }
}

/**
 * Replaces `ctx.ally` so the OAuth callback gets `callback` instead of
 * talking to Google/Microsoft. Returns a function that restores the real
 * manager.
 */
export async function fakeAlly(callback: FakeCallback): Promise<() => Promise<void>> {
  const driver = {
    accessDenied: () => callback.error === 'access_denied',
    stateMisMatch: () => callback.error === 'state_mismatch',
    hasError: () => callback.error !== undefined,
    user: async () => {
      if (!callback.profile) throw new Error('fakeAlly: no profile')
      return { ...callback.profile, nickName: callback.profile.name, avatarUrl: null }
    },
  }

  HttpContext.getter('ally', () => ({ use: () => driver }) as unknown as AllyManager<any>, true)

  return async () => {
    const config = await configProvider.resolve<any>(app, app.config.get('ally'))
    HttpContext.getter(
      'ally',
      function (this: HttpContext) {
        return new AllyManager(config, this)
      },
      true
    )
  }
}
