import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Market from '#models/market'

/**
 * A country covered by a market. A country belongs to at most one market.
 */
export default class MarketCountry extends BaseAppModel {
  @column()
  declare marketId: string

  @column()
  declare countryCode: string

  @belongsTo(() => Market)
  declare market: BelongsTo<typeof Market>
}
