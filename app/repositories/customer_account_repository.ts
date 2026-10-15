import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import type { CustomerProfileData } from '#repositories/customer_repository'

export type VerifiedAccountData = CustomerProfileData & { passwordHash: string }

export default class CustomerAccountRepository {
  async verifyCredentials(email: string, password: string): Promise<CustomerAccount> {
    return CustomerAccount.verifyCredentials(email, password)
  }

  async findByEmail(email: string): Promise<CustomerAccount | null> {
    return CustomerAccount.findBy('email', email)
  }

  async findByCustomerId(customerId: string): Promise<CustomerAccount | null> {
    return CustomerAccount.findBy('customer_id', customerId)
  }

  async loadCustomer(account: CustomerAccount): Promise<Customer> {
    await account.load('customer')
    return account.customer
  }

  async touchLastLogin(account: CustomerAccount): Promise<CustomerAccount> {
    return account.merge({ lastLoginAt: DateTime.now() }).save()
  }

  /**
   * Sets a new password (hashed by the model) and bumps `sessionVersion`,
   * which signs out every other session.
   */
  async changePassword(account: CustomerAccount, password: string): Promise<CustomerAccount> {
    return account.merge({ password, sessionVersion: account.sessionVersion + 1 }).save()
  }

  /**
   * Adds a login to an existing profile, filling profile fields that are
   * still blank. A marketing choice made while signing up replaces the
   * profile's earlier one.
   */
  async createForCustomer(
    customer: Customer,
    data: VerifiedAccountData,
    client?: TransactionClientContract
  ): Promise<CustomerAccount> {
    return this.inTransaction(client, async (trx) => {
      customer.useTransaction(trx)
      const consentChanged =
        data.acceptsMarketing !== undefined && data.acceptsMarketing !== customer.acceptsMarketing
      await customer
        .merge({
          fullName: customer.fullName ?? data.fullName,
          phone: customer.phone ?? data.phone,
          ...(consentChanged
            ? {
                acceptsMarketing: data.acceptsMarketing,
                marketingConsentAt: data.marketingConsentAt,
                marketingConsentSource: data.marketingConsentSource,
              }
            : {}),
        })
        .save()

      return this.createAccount(trx, customer, data.passwordHash)
    })
  }

  /**
   * Creates a new profile and its login together.
   */
  async createWithCustomer(
    data: VerifiedAccountData,
    client?: TransactionClientContract
  ): Promise<CustomerAccount> {
    const { passwordHash, ...profile } = data

    return this.inTransaction(client, async (trx) => {
      const customer = await Customer.create({ ...profile, isActive: true }, { client: trx })
      return this.createAccount(trx, customer, passwordHash)
    })
  }

  private inTransaction<T>(
    client: TransactionClientContract | undefined,
    callback: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    return client ? callback(client) : db.transaction(callback)
  }

  /**
   * The model's auth mixin hashes `password` on every save, so the already
   * hashed value is written with a query-builder update afterwards.
   */
  private async createAccount(
    trx: TransactionClientContract,
    customer: Customer,
    passwordHash: string
  ): Promise<CustomerAccount> {
    const account = await CustomerAccount.create(
      { customerId: customer.id, email: customer.email, password: passwordHash, sessionVersion: 0 },
      { client: trx }
    )
    await CustomerAccount.query({ client: trx })
      .where('id', account.id)
      .update({ password: passwordHash })
    account.password = passwordHash
    account.$hydrateOriginals()
    return account
  }
}
