import vine from '@vinejs/vine'
import { SOCIAL_PROVIDERS } from '#constants/social_providers'

/**
 * Validates the `:provider` param on the customer social sign-in routes.
 */
export const customerSocialProviderValidator = vine.create({
  params: vine.object({
    provider: vine.enum(SOCIAL_PROVIDERS),
  }),
})
