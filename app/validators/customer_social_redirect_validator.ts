import vine from '@vinejs/vine'
import { SOCIAL_INTENTS, SOCIAL_PROVIDERS } from '#constants/social_providers'

/**
 * Validates `:provider/oauth/redirect/:intent`. The Create account page
 * sends `signup`; the sign-in page sends `login`.
 */
export const customerSocialRedirectValidator = vine.create({
  params: vine.object({
    provider: vine.enum(SOCIAL_PROVIDERS),
    intent: vine.enum(SOCIAL_INTENTS),
  }),
})
