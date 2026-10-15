import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OrderLineItem from '#models/order_line_item'
import Refund from '#models/refund'

export default class RefundLineItem extends BaseAppModel {
  static auditable = false

  @column()
  declare refundId: string

  @column()
  declare orderLineItemId: string

  @column()
  declare quantity: number

  /** Units of `quantity` that had not shipped yet. */
  @column()
  declare removedQuantity: number

  @column({ consume: (value) => Number(value) })
  declare amount: number

  @column()
  declare restock: boolean

  @column()
  declare locationId: string | null

  @belongsTo(() => Refund)
  declare refund: BelongsTo<typeof Refund>

  @belongsTo(() => OrderLineItem)
  declare orderLineItem: BelongsTo<typeof OrderLineItem>
}
