import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import PaymentMethodMarket from '#models/payment_method_market'
import type {
  PaymentMethodCode,
  PaymentRegion,
  PoliMode,
  StripeMode,
} from '#constants/payment_methods'

export type BankTransferConfig = {
  countryCode: PaymentRegion
  accountName: string
  bankName: string
  accountNumber: string
  bsb: string | null
  instructions: string | null
}

export type { PoliMode, StripeMode }

/**
 * One Stripe account mode's keys. Secret values are encrypted with the app
 * key (`encryption` service) and are never sent back to the browser.
 */
export type StripeKeySet = {
  publishableKey: string
  secretKeyEncrypted: string
  secretKeyLastFour: string
  webhookSecretEncrypted: string | null
}

export type StripeConfig = {
  /** The key set that takes payments. */
  mode: StripeMode
  test: StripeKeySet | null
  live: StripeKeySet | null
  /** Where Stripe's back link sends shoppers; null uses the order's page. Missing on older rows. */
  cancelUrl?: string | null
}

/**
 * One POLi mode's credentials. The authentication code is encrypted with
 * the app key and never sent back to the browser.
 */
export type PoliCredentialSet = {
  merchantCode: string
  authCodeEncrypted: string
  authCodeLastFour: string
}

export type PoliConfig = {
  /** Tells POLi setups apart from Stripe's, which also have `test` and `live`. */
  gateway: 'poli'
  /** The credential set that takes payments. */
  mode: PoliMode
  test: PoliCredentialSet | null
  live: PoliCredentialSet | null
}

export type PaymentMethodConfig = BankTransferConfig | StripeConfig | PoliConfig

/**
 * Stripe setups saved before test and live keys were kept apart hold one
 * key set at the top level; read it as the set for its mode.
 */
function consumeConfig(value: unknown): PaymentMethodConfig | null {
  const config = typeof value === 'string' ? JSON.parse(value) : value
  if (!config || typeof config !== 'object' || !('secretKeyEncrypted' in config)) {
    return (config as PaymentMethodConfig | null) ?? null
  }
  const legacy = config as StripeKeySet & { mode: StripeMode; cancelUrl?: string | null }
  const keys: StripeKeySet = {
    publishableKey: legacy.publishableKey,
    secretKeyEncrypted: legacy.secretKeyEncrypted,
    secretKeyLastFour: legacy.secretKeyLastFour,
    webhookSecretEncrypted: legacy.webhookSecretEncrypted ?? null,
  }
  return {
    mode: legacy.mode,
    test: legacy.mode === 'test' ? keys : null,
    live: legacy.mode === 'live' ? keys : null,
    cancelUrl: legacy.cancelUrl ?? null,
  }
}

/**
 * A payment method the store has set up. Methods without a row are not
 * set up yet.
 */
export default class PaymentMethod extends BaseAppModel {
  static auditHidden = ['config'] as const

  static auditLabelFor(attributes: Record<string, unknown>) {
    return typeof attributes.code === 'string' ? `Payment method: ${attributes.code}` : null
  }

  @column()
  declare code: PaymentMethodCode

  @column()
  declare isEnabled: boolean

  @column({
    prepare: (value: PaymentMethodConfig | null) => (value ? JSON.stringify(value) : null),
    consume: consumeConfig,
  })
  declare config: PaymentMethodConfig | null

  @hasMany(() => PaymentMethodMarket)
  declare markets: HasMany<typeof PaymentMethodMarket>
}
