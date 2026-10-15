import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'

/**
 * Pivot row linking a variant to one value of each product option.
 */
export default class ProductVariantOptionValue extends BaseAppModel {
  @column()
  declare productVariantId: string

  @column()
  declare productOptionValueId: string

  @belongsTo(() => ProductVariant)
  declare productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ProductOptionValue)
  declare productOptionValue: BelongsTo<typeof ProductOptionValue>
}
