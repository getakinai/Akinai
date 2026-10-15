import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Order from '#models/order'
import ProductVariant from '#models/product_variant'

/**
 * One variant on an order. Titles, SKU and price are snapshots taken when
 * the draft was last saved, so the line survives catalog edits.
 */
export default class OrderLineItem extends BaseAppModel {
  @column()
  declare orderId: string

  @column()
  declare productVariantId: string | null

  @column()
  declare productTitle: string

  @column()
  declare variantTitle: string | null

  @column()
  declare sku: string | null

  @column({ consume: (value) => Number(value) })
  declare unitPrice: number

  @column()
  declare quantity: number

  /** Quantity in successful fulfillments. */
  @column()
  declare fulfilledQuantity: number

  /** Units refunded, shipped or not. */
  @column()
  declare refundedQuantity: number

  /** Refunded units that had not shipped, so they no longer need fulfilling. */
  @column()
  declare removedQuantity: number

  @column({ consume: (value) => Number(value) })
  declare lineTotal: number

  /** This line's share of the main discount (0 on orders priced before allocations). */
  @column({ consume: (value) => Number(value) })
  declare discountAllocation: number

  /** Snapshot of the product's `chargeTax` when the line was priced. */
  @column()
  declare taxable: boolean

  @column()
  declare position: number

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant)
  declare variant: BelongsTo<typeof ProductVariant>
}
