import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import Product from '#models/product'

export const REVIEW_RATING_MIN = 1
export const REVIEW_RATING_MAX = 5

/**
 * A customer's star rating and written review of a product. One per
 * customer per product. Published right away; staff can hide it or
 * feature it on the home page.
 */
export default class ProductReview extends BaseAppModel {
  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    const { title, rating } = attributes
    if (typeof title === 'string' && title.length > 0) return title.slice(0, 255)
    return typeof rating === 'number' ? `${rating}-star review` : null
  }

  @column()
  declare productId: string

  @column()
  declare customerId: string

  @column()
  declare rating: number

  @column()
  declare title: string | null

  @column()
  declare body: string

  @column()
  declare isHidden: boolean

  /** Shown as a testimonial on the storefront home page. */
  @column()
  declare isFeatured: boolean

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
