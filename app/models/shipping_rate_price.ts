import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Market from '#models/market'
import ShippingRate from '#models/shipping_rate'

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A shipping rate's price in a non-primary market, in that market's currency.
 */
export default class ShippingRatePrice extends BaseAppModel {
  @column()
  declare shippingRateId: string

  @column()
  declare marketId: string

  @column({ consume: (value) => Number(value) })
  declare price: number

  /** Subtotal bounds in this market's currency, e.g. a free-shipping threshold. */
  @column({ consume: toNumber })
  declare minSubtotal: number | null

  @column({ consume: toNumber })
  declare maxSubtotal: number | null

  @belongsTo(() => ShippingRate)
  declare rate: BelongsTo<typeof ShippingRate>

  @belongsTo(() => Market)
  declare market: BelongsTo<typeof Market>
}
