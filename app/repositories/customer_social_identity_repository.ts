import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import CustomerSocialIdentity from '#models/customer_social_identity'
import CustomerAccountRepository, {
  type VerifiedAccountData,
} from '#repositories/customer_account_repository'
import type { SocialProvider } from '#constants/social_providers'

export type SocialIdentityData = {
  provider: SocialProvider
  providerUserId: string
  email: string
}

@inject()
export default class CustomerSocialIdentityRepository {
  constructor(protected customerAccountRepository: CustomerAccountRepository) {}

  async findAccountByProvider(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<CustomerAccount | null> {
    const identity = await CustomerSocialIdentity.query()
      .where('provider', provider)
      .where('provider_user_id', providerUserId)
      .preload('customerAccount', (query) => query.preload('customer'))
      .first()
    return identity?.customerAccount ?? null
  }

  async linkToAccount(account: CustomerAccount, data: SocialIdentityData) {
    return CustomerSocialIdentity.create({ ...data, customerAccountId: account.id })
  }

  /**
   * Creates the login and its linked identity in one transaction. An
   * existing profile with no login (guest checkout, added by staff) is
   * claimed instead of creating a second one.
   */
  async createWithAccount(
    existingCustomer: Customer | null,
    account: VerifiedAccountData,
    identity: SocialIdentityData
  ): Promise<CustomerAccount> {
    return db.transaction(async (trx) => {
      const created = existingCustomer
        ? await this.customerAccountRepository.createForCustomer(existingCustomer, account, trx)
        : await this.customerAccountRepository.createWithCustomer(account, trx)

      await CustomerSocialIdentity.create(
        { ...identity, customerAccountId: created.id },
        { client: trx }
      )
      return created
    })
  }
}
