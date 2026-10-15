import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ShippingRatePrice from '#models/shipping_rate_price'
import ShippingZone from '#models/shipping_zone'

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A flat shipping price offered in a zone. Optional subtotal, weight and
 * item-count bounds limit the carts it is offered for (e.g. free shipping
 * over a minimum). Subtotal bounds apply to the primary market; other
 * markets use the bounds on their `ShippingRatePrice`.
 */
export default class ShippingRate extends BaseAppModel {
  @column()
  declare shippingZoneId: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ consume: (value) => Number(value) })
  declare price: number

  @column({ consume: toNumber })
  declare minSubtotal: number | null

  @column({ consume: toNumber })
  declare maxSubtotal: number | null

  /** In the store's weight unit. */
  @column({ consume: toNumber })
  declare minWeight: number | null

  @column({ consume: toNumber })
  declare maxWeight: number | null

  @column()
  declare minItems: number | null

  @column()
  declare maxItems: number | null

  @column()
  declare isActive: boolean

  @belongsTo(() => ShippingZone)
  declare zone: BelongsTo<typeof ShippingZone>

  @hasMany(() => ShippingRatePrice)
  declare marketPrices: HasMany<typeof ShippingRatePrice>
}
