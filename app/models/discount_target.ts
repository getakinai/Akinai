import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Collection from '#models/collection'
import Product from '#models/product'

export const DISCOUNT_TARGET_ROLES = ['applies', 'buy', 'get'] as const

export type DiscountTargetRole = (typeof DISCOUNT_TARGET_ROLES)[number]

/**
 * A product or collection a discount is limited to. `applies` targets
 * belong to amount-off-products discounts; `buy` / `get` to Buy X get Y.
 * Exactly one of `productId` / `collectionId` is set.
 */
export default class DiscountTarget extends BaseAppModel {
  @column()
  declare discountId: string

  @column()
  declare role: DiscountTargetRole

  @column()
  declare productId: string | null

  @column()
  declare collectionId: string | null

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Collection)
  declare collection: BelongsTo<typeof Collection>
}
