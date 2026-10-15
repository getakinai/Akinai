export const PAYMENT_METHOD_CODES = [
  'bank_transfer',
  'stripe',
  'windcave',
  'poli',
  'afterpay',
  'laybuy',
  'zip',
  'paypal',
] as const

export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number]

export const PAYMENT_REGIONS = ['NZ', 'AU'] as const

export type PaymentRegion = (typeof PAYMENT_REGIONS)[number]

export type PaymentMethodStatus = 'available' | 'coming_soon'

export type PaymentMethodDefinition = {
  code: PaymentMethodCode
  name: string
  description: string
  regions: readonly PaymentRegion[]
  status: PaymentMethodStatus
}

/**
 * Payment methods offered to New Zealand and Australian stores, in the
 * order they appear on the admin Payments page.
 */
export const PAYMENT_METHOD_CATALOG: readonly PaymentMethodDefinition[] = [
  {
    code: 'bank_transfer',
    name: 'Bank transfer',
    description:
      'Customers pay into your bank account using HPDL plus their order number (e.g. HPDL1001) as the reference.',
    regions: ['NZ', 'AU'],
    status: 'available',
  },
  {
    code: 'stripe',
    name: 'Stripe',
    description: 'Credit and debit cards, Apple Pay and Google Pay on a Stripe-hosted page.',
    regions: ['NZ', 'AU'],
    status: 'available',
  },
  {
    code: 'windcave',
    name: 'Windcave',
    description: 'Card payments through the New Zealand gateway formerly known as Payment Express.',
    regions: ['NZ', 'AU'],
    status: 'coming_soon',
  },
  {
    code: 'poli',
    name: 'POLi',
    description: 'Pay directly from online banking without a card.',
    regions: ['NZ', 'AU'],
    status: 'available',
  },
  {
    code: 'afterpay',
    name: 'Afterpay',
    description: 'Buy now, pay later in four fortnightly instalments.',
    regions: ['NZ', 'AU'],
    status: 'coming_soon',
  },
  {
    code: 'laybuy',
    name: 'Laybuy',
    description: 'Buy now, pay later in six weekly instalments.',
    regions: ['NZ'],
    status: 'coming_soon',
  },
  {
    code: 'zip',
    name: 'Zip',
    description: 'Buy now, pay later with flexible repayments.',
    regions: ['NZ', 'AU'],
    status: 'coming_soon',
  },
  {
    code: 'paypal',
    name: 'PayPal',
    description: 'Customers pay with their PayPal account.',
    regions: ['NZ', 'AU'],
    status: 'coming_soon',
  },
]

/** NZ bank account: bank-branch-account-suffix, e.g. 12-3456-0123456-00. */
export const NZ_ACCOUNT_NUMBER = /^\d{2}-?\d{4}-?\d{7}-?\d{2,3}$/

/** AU bank-state-branch number, e.g. 062-000. */
export const AU_BSB = /^\d{3}-?\d{3}$/

export const AU_ACCOUNT_NUMBER = /^\d{6,10}$/

/** `test` is the Stripe sandbox, `live` is production. */
export const STRIPE_MODES = ['test', 'live'] as const

export type StripeMode = (typeof STRIPE_MODES)[number]

export const STRIPE_PUBLISHABLE_KEY = /^pk_(test|live)_[A-Za-z0-9]+$/

/** Secret or restricted key. */
export const STRIPE_SECRET_KEY = /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/

export const STRIPE_WEBHOOK_SECRET = /^whsec_[A-Za-z0-9]+$/

/** Methods paid on the provider's own page; the order waits as a pending checkout until paid. */
export const ONLINE_PAYMENT_METHODS = ['stripe', 'poli'] as const

export type OnlinePaymentMethod = (typeof ONLINE_PAYMENT_METHODS)[number]

export function isOnlinePaymentMethod(
  code: string | null | undefined
): code is OnlinePaymentMethod {
  return code === 'stripe' || code === 'poli'
}

/** `test` is the POLi sandbox (UAT), `live` is production. */
export const POLI_MODES = ['test', 'live'] as const

export type PoliMode = (typeof POLI_MODES)[number]

/** POLi only pays in these currencies, so it is only offered in markets that use them. */
export const POLI_CURRENCIES = ['NZD', 'AUD'] as const

export const POLI_API_BASE_URLS: Record<PoliMode, string> = {
  test: 'https://poliapi.uat3.paywithpoli.com/api/v2',
  live: 'https://poliapi.apac.paywithpoli.com/api/v2',
}

export function isPoliCurrency(currencyCode: string | null | undefined): boolean {
  const code = currencyCode?.toUpperCase()
  return POLI_CURRENCIES.some((currency) => currency === code)
}

export const POLI_MERCHANT_CODE = /^[A-Za-z0-9_-]+$/
