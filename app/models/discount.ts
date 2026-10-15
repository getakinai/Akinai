import { DateTime } from 'luxon'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import DiscountTarget from '#models/discount_target'

export const DISCOUNT_TYPES = [
  'amount_off_products',
  'buy_x_get_y',
  'amount_off_order',
  'free_shipping',
] as const

export type DiscountType = (typeof DISCOUNT_TYPES)[number]

export const DISCOUNT_METHODS = ['code', 'automatic'] as const

export type DiscountMethod = (typeof DISCOUNT_METHODS)[number]

export const DISCOUNT_VALUE_TYPES = ['percentage', 'fixed_amount'] as const

export type DiscountValueType = (typeof DISCOUNT_VALUE_TYPES)[number]

export const DISCOUNT_STATUSES = ['active', 'scheduled', 'expired', 'archived'] as const

export type DiscountStatus = (typeof DISCOUNT_STATUSES)[number]

/** What a product-scoped discount targets: hand-picked products or collections. */
export const DISCOUNT_APPLIES_TO = ['products', 'collections'] as const

export type DiscountAppliesTo = (typeof DISCOUNT_APPLIES_TO)[number]

/** Buy X get Y: the customer must buy a number of items or spend an amount. */
export const DISCOUNT_BUY_REQUIREMENTS = ['quantity', 'amount'] as const

export type DiscountBuyRequirement = (typeof DISCOUNT_BUY_REQUIREMENTS)[number]

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A discount of one `type`:
 * - `amount_off_order`: `value` off the order subtotal.
 * - `amount_off_products`: `value` off each line in the `applies` targets.
 * - `buy_x_get_y`: buying `buyValue` (items or amount) of the `buy` targets
 *   takes `value` off `getQuantity` items of the `get` targets.
 * - `free_shipping`: the shipping rate is free when it costs at most
 *   `maxShippingPrice` (or always, when null).
 *
 * Code discounts are applied when the customer (or staff) enters `code`;
 * automatic discounts apply on their own at checkout.
 */
export default class Discount extends BaseAppModel {
  @column()
  declare title: string

  @column()
  declare type: DiscountType

  @column()
  declare code: string | null

  @column()
  declare method: DiscountMethod

  @column()
  declare valueType: DiscountValueType

  /** Null for free shipping. */
  @column({ consume: toNumber })
  declare value: number | null

  @column({ consume: toNumber })
  declare minSubtotal: number | null

  @column()
  declare appliesTo: DiscountAppliesTo | null

  @column()
  declare buyRequirement: DiscountBuyRequirement | null

  @column({ consume: toNumber })
  declare buyValue: number | null

  @column()
  declare buyAppliesTo: DiscountAppliesTo | null

  @column()
  declare getQuantity: number | null

  @column()
  declare maxUsesPerOrder: number | null

  @column({ consume: toNumber })
  declare maxShippingPrice: number | null

  @column()
  declare usageLimit: number | null

  @column()
  declare usageCount: number

  @column()
  declare oncePerCustomer: boolean

  @column.dateTime()
  declare startsAt: DateTime

  @column.dateTime()
  declare endsAt: DateTime | null

  @column.dateTime()
  declare archivedAt: DateTime | null

  @hasMany(() => DiscountTarget)
  declare targets: HasMany<typeof DiscountTarget>

  get isShipping() {
    return this.type === 'free_shipping'
  }

  /**
   * Running out of uses counts as expired.
   */
  statusAt(at: DateTime = DateTime.now()): DiscountStatus {
    if (this.archivedAt) return 'archived'
    if (this.startsAt > at) return 'scheduled'
    if (this.endsAt && this.endsAt <= at) return 'expired'
    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return 'expired'
    return 'active'
  }
}
