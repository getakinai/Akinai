import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'
import type { InferSocialProviders } from '@adonisjs/ally/types'
import { microsoftService } from '#utils/microsoft_ally_driver'

const appUrl = env.get('APP_URL').replace(/\/$/, '')

const allyConfig = defineConfig({
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID') ?? '',
    clientSecret: env.get('GOOGLE_CLIENT_SECRET')?.release() ?? '',
    callbackUrl: env.get('GOOGLE_CLIENT_REDIRECT_URL') ?? `${appUrl}/google/oauth/callback`,
    scopes: ['openid', 'userinfo.email', 'userinfo.profile'],
    prompt: 'select_account',
  }),
  microsoft: microsoftService({
    clientId: env.get('MICROSOFT_CLIENT_ID') ?? '',
    clientSecret: env.get('MICROSOFT_CLIENT_SECRET')?.release() ?? '',
    callbackUrl: env.get('MICROSOFT_CLIENT_REDIRECT_URL') ?? `${appUrl}/microsoft/oauth/callback`,
    tenant: 'consumers',
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
