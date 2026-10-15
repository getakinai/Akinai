import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import CustomerAddress from '#models/customer_address'

export type CustomerAddressData = {
  fullName: string | null
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string | null
  regionCode?: string | null
  postalCode: string | null
  countryCode: string
  phone: string | null
  isDefault: boolean
}

export default class CustomerAddressRepository {
  /** Default first, then newest. */
  async listForCustomer(customerId: string, limit = 20): Promise<CustomerAddress[]> {
    return CustomerAddress.query()
      .where('customer_id', customerId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  async findForCustomerOrFail(customerId: string, id: string): Promise<CustomerAddress> {
    return CustomerAddress.query().where('id', id).where('customer_id', customerId).firstOrFail()
  }

  /**
   * The customer's first address is always the default. Runs inside `trx`
   * when given, so callers can save the address with other writes.
   */
  async create(
    customerId: string,
    data: CustomerAddressData,
    trx?: TransactionClientContract
  ): Promise<CustomerAddress> {
    if (!trx) return db.transaction((client) => this.create(customerId, data, client))

    const existing = await CustomerAddress.query({ client: trx })
      .where('customer_id', customerId)
      .first()
    const isDefault = data.isDefault || !existing

    if (isDefault) await this.clearDefault(customerId, trx)
    return CustomerAddress.create({ ...data, customerId, isDefault }, { client: trx })
  }

  /**
   * Unsetting the only default is ignored so the customer keeps one.
   */
  async update(address: CustomerAddress, data: CustomerAddressData): Promise<CustomerAddress> {
    return db.transaction(async (trx) => {
      const isDefault = data.isDefault || address.isDefault
      if (isDefault && !address.isDefault) await this.clearDefault(address.customerId, trx)

      address.useTransaction(trx)
      return address.merge({ ...data, isDefault }).save()
    })
  }

  /**
   * Deleting the default promotes the newest remaining address.
   */
  async delete(address: CustomerAddress): Promise<void> {
    await db.transaction(async (trx) => {
      address.useTransaction(trx)
      await address.delete()

      if (!address.isDefault) return

      const next = await CustomerAddress.query({ client: trx })
        .where('customer_id', address.customerId)
        .orderBy('created_at', 'desc')
        .first()
      if (next) {
        next.useTransaction(trx)
        await next.merge({ isDefault: true }).save()
      }
    })
  }

  private async clearDefault(customerId: string, trx: TransactionClientContract) {
    await CustomerAddress.query({ client: trx })
      .where('customer_id', customerId)
      .where('is_default', true)
      .update({ is_default: false })
  }
}
