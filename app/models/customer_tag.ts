import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

/**
 * A staff label on a customer, used to filter the list and build segments.
 * Names are stored trimmed and lowercased.
 */
export default class CustomerTag extends BaseAppModel {
  @column()
  declare customerId: string

  @column()
  declare name: string
}
