/** Storefront form a newsletter subscriber last signed up through. */
export const NEWSLETTER_SOURCES = ['footer', 'maintenance'] as const

export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number]
