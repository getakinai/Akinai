import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Market from '#models/market'
import PaymentMethod, { type BankTransferConfig } from '#models/payment_method'

/**
 * Whether a payment method is offered in a market. Bank transfer keeps its
 * account details per market in `config`; Stripe uses the keys on the
 * payment method, so `config` stays null.
 */
export default class PaymentMethodMarket extends BaseAppModel {
  static auditHidden = ['config'] as const

  static auditLabelFor() {
    return 'Payment method market'
  }

  @column()
  declare paymentMethodId: string

  @column()
  declare marketId: string

  @column()
  declare isEnabled: boolean

  @column({
    prepare: (value: BankTransferConfig | null) => (value ? JSON.stringify(value) : null),
  })
  declare config: BankTransferConfig | null

  @belongsTo(() => PaymentMethod)
  declare paymentMethod: BelongsTo<typeof PaymentMethod>

  @belongsTo(() => Market)
  declare market: BelongsTo<typeof Market>
}
