import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import MarketCountry from '#models/market_country'

/**
 * A group of countries sold to in one currency. Exactly one market is the
 * primary market; it is used for countries no other market covers.
 */
export default class Market extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare handle: string

  @column()
  declare currencyCode: string

  @column()
  declare pricesIncludeTax: boolean

  @column()
  declare isPrimary: boolean

  @column()
  declare isActive: boolean

  @hasMany(() => MarketCountry)
  declare countries: HasMany<typeof MarketCountry>
}
