import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Fulfillment from '#models/fulfillment'
import OrderLineItem from '#models/order_line_item'

export default class FulfillmentLineItem extends BaseAppModel {
  @column()
  declare fulfillmentId: string

  @column()
  declare orderLineItemId: string

  @column()
  declare quantity: number

  @belongsTo(() => Fulfillment)
  declare fulfillment: BelongsTo<typeof Fulfillment>

  @belongsTo(() => OrderLineItem)
  declare orderLineItem: BelongsTo<typeof OrderLineItem>
}
