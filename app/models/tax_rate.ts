import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

/**
 * Tax charged in a country, or in one region of it when `regionCode` is
 * set. `rate` is a percentage (12.5 means 12.5%).
 */
export default class TaxRate extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare countryCode: string

  @column()
  declare regionCode: string | null

  @column({ consume: (value) => Number(value) })
  declare rate: number

  @column()
  declare appliesToShipping: boolean

  @column()
  declare isActive: boolean
}
