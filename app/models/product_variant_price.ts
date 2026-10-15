import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Market from '#models/market'
import ProductVariant from '#models/product_variant'

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A variant's price in a non-primary market, in that market's currency. The
 * primary market uses the price on the variant itself.
 */
export default class ProductVariantPrice extends BaseAppModel {
  @column()
  declare productVariantId: string

  @column()
  declare marketId: string

  @column({ consume: (value) => Number(value) })
  declare price: number

  @column({ consume: toNumber })
  declare compareAtPrice: number | null

  @belongsTo(() => ProductVariant)
  declare variant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => Market)
  declare market: BelongsTo<typeof Market>
}
