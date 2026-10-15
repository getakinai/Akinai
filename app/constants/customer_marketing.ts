/** Where a customer last gave or withdrew marketing consent. */
export const MARKETING_CONSENT_SOURCES = [
  'signup',
  'checkout',
  'newsletter',
  'account',
  'admin',
] as const

export type MarketingConsentSource = (typeof MARKETING_CONSENT_SOURCES)[number]

export const MAX_CUSTOMER_TAGS = 20

export const MAX_CUSTOMER_TAG_LENGTH = 40

export const MAX_CUSTOMER_NOTE_LENGTH = 5000

export const MAX_CUSTOMER_SEGMENT_NAME_LENGTH = 100

export const MAX_CUSTOMER_SEGMENTS = 100

/** Saved filters on the admin customers list. Every key is optional. */
export type CustomerSegmentFilters = {
  tags?: string[]
  marketing?: 'subscribed' | 'not_subscribed'
  countryCode?: string
  ordersMin?: number
  ordersMax?: number
  /** Total spent is summed in this currency only; orders in others are ignored. */
  spentCurrency?: string
  spentMin?: number
  spentMax?: number
  /** `YYYY-MM-DD`, inclusive, compared in UTC. */
  lastOrderFrom?: string
  lastOrderTo?: string
}
