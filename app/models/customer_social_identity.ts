import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import CustomerAccount from '#models/customer_account'
import type { SocialProvider } from '#constants/social_providers'

/**
 * A Google or Microsoft login linked to a customer account.
 */
export default class CustomerSocialIdentity extends BaseAppModel {
  @column()
  declare customerAccountId: string

  @column()
  declare provider: SocialProvider

  @column()
  declare providerUserId: string

  @column()
  declare email: string

  @belongsTo(() => CustomerAccount)
  declare customerAccount: BelongsTo<typeof CustomerAccount>
}
