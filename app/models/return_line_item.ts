import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OrderLineItem from '#models/order_line_item'
import OrderReturn, { type ReturnReason } from '#models/order_return'

export default class ReturnLineItem extends BaseAppModel {
  static auditable = false

  @column()
  declare returnId: string

  @column()
  declare orderLineItemId: string

  @column()
  declare quantity: number

  @column()
  declare reason: ReturnReason

  @column()
  declare note: string | null

  @column()
  declare restock: boolean

  @column()
  declare locationId: string | null

  @belongsTo(() => OrderReturn, { foreignKey: 'returnId' })
  declare orderReturn: BelongsTo<typeof OrderReturn>

  @belongsTo(() => OrderLineItem)
  declare orderLineItem: BelongsTo<typeof OrderLineItem>
}
