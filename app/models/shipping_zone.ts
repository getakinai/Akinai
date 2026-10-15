import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ShippingRate from '#models/shipping_rate'
import ShippingZoneCountry from '#models/shipping_zone_country'
import ShippingZoneRegion from '#models/shipping_zone_region'

/**
 * A set of destinations (whole countries and/or regions of a country) that
 * share the same shipping rates.
 */
export default class ShippingZone extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @hasMany(() => ShippingZoneCountry)
  declare countries: HasMany<typeof ShippingZoneCountry>

  @hasMany(() => ShippingZoneRegion)
  declare regions: HasMany<typeof ShippingZoneRegion>

  @hasMany(() => ShippingRate)
  declare rates: HasMany<typeof ShippingRate>
}
