import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'

/**
 * Saved address on a customer profile. At most one per customer is the
 * default.
 */
export default class CustomerAddress extends BaseAppModel {
  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    const parts = [attributes.address1, attributes.city].filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    )
    return parts.length > 0 ? parts.join(', ').slice(0, 255) : null
  }

  @column()
  declare customerId: string

  @column()
  declare fullName: string | null

  @column()
  declare company: string | null

  @column({ columnName: 'address1' })
  declare address1: string

  @column({ columnName: 'address2' })
  declare address2: string | null

  @column()
  declare city: string

  @column()
  declare province: string | null

  /** ISO 3166-2 code of `province`, for countries with a region list. */
  @column()
  declare regionCode: string | null

  @column()
  declare postalCode: string | null

  @column()
  declare countryCode: string

  @column()
  declare phone: string | null

  @column()
  declare isDefault: boolean

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
