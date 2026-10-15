export const SOCIAL_PROVIDERS = ['google', 'microsoft'] as const

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]

/**
 * Where a Google/Microsoft sign-in started. Only `signup` (the Create
 * account page) may create a new account; `login` needs an existing one.
 */
export const SOCIAL_INTENTS = ['login', 'signup'] as const

export type SocialIntent = (typeof SOCIAL_INTENTS)[number]

/** Session key holding the intent between the OAuth redirect and callback. */
export const SOCIAL_INTENT_SESSION_KEY = 'customer_social_intent'
