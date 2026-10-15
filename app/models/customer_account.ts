import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'

/**
 * Storefront login for a customer profile. Authenticated through the
 * `customer` guard. `email` mirrors the profile email.
 */
export default class CustomerAccount extends compose(
  BaseAppModel,
  withAuthFinder(() => hash.use())
) {
  @column()
  declare customerId: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  /**
   * Bumped when the password changes. Sessions that stored an older value
   * are signed out by `CustomerSessionVersionMiddleware`.
   */
  @column({ serializeAs: null })
  declare sessionVersion: number

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
