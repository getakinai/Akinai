import { z } from 'zod'

export const PAYMENT_REGIONS = ['NZ', 'AU'] as const

export type PaymentRegion = (typeof PAYMENT_REGIONS)[number]

const NZ_ACCOUNT_NUMBER = /^\d{2}-?\d{4}-?\d{7}-?\d{2,3}$/
const AU_BSB = /^\d{3}-?\d{3}$/
const AU_ACCOUNT_NUMBER = /^\d{6,10}$/

export const AdminPaymentMethodSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  regions: z.array(z.enum(PAYMENT_REGIONS)),
  status: z.enum(['available', 'coming_soon']),
  adminRoute: z.string().nullable(),
  isEnabled: z.boolean(),
  configured: z.boolean(),
  mode: z.enum(['test', 'live']).nullable(),
  markets: z.array(z.object({ id: z.string(), name: z.string() })),
})

export type AdminPaymentMethod = z.infer<typeof AdminPaymentMethodSchema>

export const AdminPaymentMethodsResponseSchema = z.object({
  data: z.array(AdminPaymentMethodSchema),
})

export const AdminPaymentMarketSchema = z.object({
  id: z.string(),
  name: z.string(),
  currencyCode: z.string(),
  isPrimary: z.boolean(),
  countryCodes: z.array(z.string()),
})

export type AdminPaymentMarket = z.infer<typeof AdminPaymentMarketSchema>

export const AdminPaymentMarketsResponseSchema = z.object({
  data: z.array(AdminPaymentMarketSchema),
})

export const AdminBankTransferMarketSchema = z.object({
  marketId: z.string(),
  marketName: z.string(),
  countryCodes: z.array(z.string()),
  isEnabled: z.boolean(),
  countryCode: z.enum(PAYMENT_REGIONS).nullable(),
  accountName: z.string().nullable(),
  bankName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  bsb: z.string().nullable(),
  instructions: z.string().nullable(),
})

export type AdminBankTransferMarket = z.infer<typeof AdminBankTransferMarketSchema>

export const AdminBankTransferSchema = z.object({
  markets: z.array(AdminBankTransferMarketSchema),
})

export type AdminBankTransfer = z.infer<typeof AdminBankTransferSchema>

export const AdminBankTransferResponseSchema = z.object({ data: AdminBankTransferSchema })

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max)

export const AdminBankTransferFormSchema = z
  .object({
    isEnabled: z.boolean(),
    countryCode: z.enum(PAYMENT_REGIONS, 'Select a country'),
    accountName: required('Account name', 100),
    bankName: required('Bank name', 100),
    accountNumber: required('Account number', 24),
    bsb: z.string().trim().nullable(),
    instructions: z.string().trim().max(500).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.countryCode === 'NZ' && !NZ_ACCOUNT_NUMBER.test(value.accountNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountNumber'],
        message: 'Enter the account number as 00-0000-0000000-00',
      })
    }
    if (value.countryCode === 'AU') {
      if (!AU_ACCOUNT_NUMBER.test(value.accountNumber)) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountNumber'],
          message: 'Enter a 6 to 10 digit account number',
        })
      }
      if (!value.bsb || !AU_BSB.test(value.bsb)) {
        ctx.addIssue({ code: 'custom', path: ['bsb'], message: 'Enter the BSB as 000-000' })
      }
    }
  })

export type AdminBankTransferForm = z.infer<typeof AdminBankTransferFormSchema>

export const STRIPE_MODES = ['test', 'live'] as const

export const StripeModeSchema = z.enum(STRIPE_MODES)

export type StripeMode = z.infer<typeof StripeModeSchema>

export const STRIPE_MODE_LABELS: Record<StripeMode, string> = {
  test: 'Sandbox',
  live: 'Production',
}

export const AdminStripeKeysSchema = z.object({
  publishableKey: z.string(),
  secretKeyLastFour: z.string(),
  hasWebhookSecret: z.boolean(),
})

export type AdminStripeKeys = z.infer<typeof AdminStripeKeysSchema>

export const AdminStripeSchema = z.object({
  isEnabled: z.boolean(),
  mode: z.enum(STRIPE_MODES).nullable(),
  test: AdminStripeKeysSchema.nullable(),
  live: AdminStripeKeysSchema.nullable(),
  cancelUrl: z.string().nullable(),
  marketIds: z.array(z.string()),
})

export type AdminStripe = z.infer<typeof AdminStripeSchema>

export const AdminStripeResponseSchema = z.object({ data: AdminStripeSchema })

const StripeKeysFormSchema = z.object({
  publishableKey: z
    .string()
    .trim()
    .regex(/^pk_(test|live)_[A-Za-z0-9]+$/, 'Enter a publishable key starting with pk_')
    .nullable(),
  secretKey: z
    .string()
    .trim()
    .regex(/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/, 'Enter a secret key starting with sk_ or rk_')
    .nullable(),
  webhookSecret: z
    .string()
    .trim()
    .regex(/^whsec_[A-Za-z0-9]+$/, 'Enter a signing secret starting with whsec_')
    .nullable(),
})

export type AdminStripeKeysForm = z.infer<typeof StripeKeysFormSchema>

export const AdminStripeFormSchema = z
  .object({
    mode: z.enum(STRIPE_MODES),
    test: StripeKeysFormSchema,
    live: StripeKeysFormSchema,
    marketIds: z.array(z.string()).max(500),
    cancelUrl: z
      .string()
      .trim()
      .max(500)
      .regex(/^https?:\/\/\S+$/i, 'Enter a full URL starting with https://')
      .nullable(),
  })
  .superRefine((value, ctx) => {
    for (const mode of STRIPE_MODES) {
      const keys = value[mode]
      const label = STRIPE_MODE_LABELS[mode].toLowerCase()
      if (keys.publishableKey && !keys.publishableKey.startsWith(`pk_${mode}_`)) {
        ctx.addIssue({
          code: 'custom',
          path: [mode, 'publishableKey'],
          message: `Use a ${label} key starting with pk_${mode}_`,
        })
      }
      if (keys.secretKey && !keys.secretKey.includes(`_${mode}_`)) {
        ctx.addIssue({
          code: 'custom',
          path: [mode, 'secretKey'],
          message: `Use a ${label} secret key (sk_${mode}_ or rk_${mode}_)`,
        })
      }
    }
    if (!value[value.mode].publishableKey) {
      const label = STRIPE_MODE_LABELS[value.mode].toLowerCase()
      ctx.addIssue({
        code: 'custom',
        path: [value.mode, 'publishableKey'],
        message: `Add your ${label} keys before switching to ${label}`,
      })
    }
  })

export type AdminStripeForm = z.infer<typeof AdminStripeFormSchema>

export const POLI_CURRENCIES = ['NZD', 'AUD'] as const

export const isPoliCurrency = (currencyCode: string) =>
  POLI_CURRENCIES.some((currency) => currency === currencyCode.toUpperCase())

export const AdminPoliCredentialsSchema = z.object({
  merchantCode: z.string(),
  authCodeLastFour: z.string(),
})

export type AdminPoliCredentials = z.infer<typeof AdminPoliCredentialsSchema>

export const AdminPoliSchema = z.object({
  isEnabled: z.boolean(),
  mode: z.enum(STRIPE_MODES).nullable(),
  test: AdminPoliCredentialsSchema.nullable(),
  live: AdminPoliCredentialsSchema.nullable(),
  marketIds: z.array(z.string()),
})

export type AdminPoli = z.infer<typeof AdminPoliSchema>

export const AdminPoliResponseSchema = z.object({ data: AdminPoliSchema })

const PoliCredentialsFormSchema = z.object({
  merchantCode: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, 'Enter the merchant code from your POLi welcome email')
    .nullable(),
  authenticationCode: z.string().trim().max(128).nullable(),
})

export type AdminPoliCredentialsForm = z.infer<typeof PoliCredentialsFormSchema>

export const AdminPoliFormSchema = z
  .object({
    mode: z.enum(STRIPE_MODES),
    test: PoliCredentialsFormSchema,
    live: PoliCredentialsFormSchema,
    marketIds: z.array(z.string()).max(500),
  })
  .superRefine((value, ctx) => {
    if (!value[value.mode].merchantCode) {
      const label = STRIPE_MODE_LABELS[value.mode].toLowerCase()
      ctx.addIssue({
        code: 'custom',
        path: [value.mode, 'merchantCode'],
        message: `Add your ${label} credentials before switching to ${label}`,
      })
    }
  })

export type AdminPoliForm = z.infer<typeof AdminPoliFormSchema>
