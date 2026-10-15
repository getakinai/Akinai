import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ShippingZone from '#models/shipping_zone'

/**
 * A region (ISO 3166-2, e.g. `PH-CEB`) covered by a shipping zone. A region
 * belongs to at most one zone, and takes precedence over a zone covering
 * its whole country.
 */
export default class ShippingZoneRegion extends BaseAppModel {
  @column()
  declare shippingZoneId: string

  @column()
  declare countryCode: string

  @column()
  declare regionCode: string

  @belongsTo(() => ShippingZone)
  declare zone: BelongsTo<typeof ShippingZone>
}
