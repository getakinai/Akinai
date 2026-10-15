import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { OrderNoteVisibility } from '#constants/order_notes'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import Order from '#models/order'
import User from '#models/user'

/**
 * Note on a placed order. Staff notes (`userId`) are internal or visible to
 * the customer; customer replies (`customerId`, `parentId`) answer a
 * customer-visible staff note.
 */
export default class OrderNote extends BaseAppModel {
  static auditable = false

  @column()
  declare orderId: string

  @column()
  declare userId: string | null

  @column()
  declare customerId: string | null

  @column()
  declare parentId: string | null

  @column()
  declare visibility: OrderNoteVisibility

  @column()
  declare body: string

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => OrderNote, { foreignKey: 'parentId' })
  declare replies: HasMany<typeof OrderNote>

  get isFromCustomer() {
    return this.customerId !== null
  }
}
