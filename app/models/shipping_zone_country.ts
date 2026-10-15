import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ShippingZone from '#models/shipping_zone'

/**
 * A country covered by a shipping zone. A country belongs to at most one
 * zone.
 */
export default class ShippingZoneCountry extends BaseAppModel {
  @column()
  declare shippingZoneId: string

  @column()
  declare countryCode: string

  @belongsTo(() => ShippingZone)
  declare zone: BelongsTo<typeof ShippingZone>
}
