import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import CustomerTag from '#models/customer_tag'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'
import type { CustomerSegmentFilters, MarketingConsentSource } from '#constants/customer_marketing'

export type MarketingConsentData = {
  acceptsMarketing: boolean
  marketingConsentAt: DateTime
  marketingConsentSource: MarketingConsentSource
}

export type CustomerProfileData = {
  fullName: string | null
  email: string
  phone: string | null
  countryCode?: string | null
  timezone?: string | null
  marketId?: string | null
} & Partial<MarketingConsentData>

export type CustomerLocationData = {
  countryCode: string
  timezone: string
  marketId: string | null
}

export type CustomerSortKey = 'fullName' | 'email' | 'createdAt'

export type CustomerStatusFilter = 'active' | 'archived'

export type PaginateCustomersData = CustomerSegmentFilters & {
  q?: string
  status?: CustomerStatusFilter
  sort: CustomerSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

export type CustomerFilterOptions = {
  tags: string[]
  countryCodes: string[]
  currencyCodes: string[]
}

const sortColumns: Record<CustomerSortKey, string> = {
  fullName: 'customers.full_name',
  email: 'customers.email',
  createdAt: 'customers.created_at',
}

/** The consent columns for a change made now from `source`. */
export function marketingConsent(
  acceptsMarketing: boolean,
  source: MarketingConsentSource
): MarketingConsentData {
  return {
    acceptsMarketing,
    marketingConsentAt: DateTime.now(),
    marketingConsentSource: source,
  }
}

/**
 * Per customer: placed (open) orders, the latest one, and the total spent
 * in the bound currency after refunds. One grouped pass over orders,
 * joined 1:1.
 */
const ORDER_STATS_JOIN = `left join (
  select customer_id,
    count(*) as orders_count,
    max(completed_at) as last_order_at,
    coalesce(sum(case when currency_code = ? then total - refunded_total else 0 end), 0) as total_spent
  from orders
  where status = 'open' and customer_id is not null
  group by customer_id
) as order_stats on order_stats.customer_id = customers.id`

export default class CustomerRepository {
  async paginate({
    q,
    status,
    sort,
    direction,
    page,
    perPage,
    tags,
    marketing,
    countryCode,
    ordersMin,
    ordersMax,
    spentCurrency,
    spentMin,
    spentMax,
    lastOrderFrom,
    lastOrderTo,
  }: PaginateCustomersData) {
    const ordersCount = 'coalesce(order_stats.orders_count, 0)'
    const totalSpent = 'coalesce(order_stats.total_spent, 0)'
    const filterSpent = spentCurrency && (spentMin !== undefined || spentMax !== undefined)

    return Customer.query()
      .select('customers.*', 'order_stats.orders_count', 'order_stats.last_order_at')
      .joinRaw(ORDER_STATS_JOIN, [spentCurrency ?? ''])
      .preload('account')
      .preload('tags', (query) => query.select('customer_id', 'name').orderBy('name', 'asc'))
      .withCount('addresses', (query) => query.as('addresses_count'))
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('customers.full_name', containsPattern(q))
            .orWhereILike('customers.email', containsPattern(q))
            .orWhereILike('customers.phone', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('customers.is_active', status === 'active'))
      .if(tags && tags.length > 0, (query) => {
        query.whereExists((sub) => {
          sub
            .from('customer_tags')
            .whereColumn('customer_tags.customer_id', 'customers.id')
            .whereIn('customer_tags.name', tags!)
        })
      })
      .if(marketing, (query) =>
        query.where('customers.accepts_marketing', marketing === 'subscribed')
      )
      .if(countryCode, (query) => query.where('customers.country_code', countryCode!))
      .if(ordersMin !== undefined, (query) => query.whereRaw(`${ordersCount} >= ?`, [ordersMin!]))
      .if(ordersMax !== undefined, (query) => query.whereRaw(`${ordersCount} <= ?`, [ordersMax!]))
      .if(filterSpent && spentMin !== undefined, (query) =>
        query.whereRaw(`${totalSpent} >= ?`, [spentMin!])
      )
      .if(filterSpent && spentMax !== undefined, (query) =>
        query.whereRaw(`${totalSpent} <= ?`, [spentMax!])
      )
      .if(lastOrderFrom, (query) =>
        query.where('order_stats.last_order_at', '>=', `${lastOrderFrom} 00:00:00`)
      )
      .if(lastOrderTo, (query) =>
        query.where(
          'order_stats.last_order_at',
          '<',
          DateTime.fromISO(lastOrderTo!, { zone: 'utc' }).plus({ days: 1 }).toSQLDate()!
        )
      )
      .orderBy(sortColumns[sort], direction)
      .orderBy('customers.id', direction)
      .paginate(page, perPage)
  }

  /**
   * Values staff can pick in the list filters: tags in use, customer
   * countries and the currencies of placed orders.
   */
  async filterOptions(): Promise<CustomerFilterOptions> {
    const [tags, countries, currencies] = await Promise.all([
      db.from('customer_tags').distinct('name').orderBy('name', 'asc').limit(500),
      db
        .from('customers')
        .distinct('country_code')
        .whereNotNull('country_code')
        .orderBy('country_code', 'asc'),
      db
        .from('orders')
        .distinct('currency_code')
        .where('status', 'open')
        .orderBy('currency_code', 'asc'),
    ])
    return {
      tags: tags.map((row) => row.name as string),
      countryCodes: countries.map((row) => row.country_code as string),
      currencyCodes: currencies.map((row) => row.currency_code as string),
    }
  }

  async findOrFail(id: string): Promise<Customer> {
    return Customer.findOrFail(id)
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return Customer.findBy('email', email)
  }

  /**
   * The profile with its account, tags and addresses (default first).
   */
  async findDetailOrFail(id: string): Promise<Customer> {
    return Customer.query()
      .where('id', id)
      .preload('account')
      .preload('tags', (query) => query.orderBy('name', 'asc'))
      .preload('addresses', (query) =>
        query.orderBy('is_default', 'desc').orderBy('created_at', 'asc')
      )
      .firstOrFail()
  }

  async create(data: CustomerProfileData, trx?: TransactionClientContract): Promise<Customer> {
    return Customer.create({ ...data, isActive: true }, { client: trx })
  }

  /**
   * Updates the profile and keeps the account login email in sync.
   */
  async update(customer: Customer, data: CustomerProfileData): Promise<Customer> {
    return db.transaction(async (trx) => {
      customer.useTransaction(trx)
      await customer.merge(data).save()

      await CustomerAccount.query({ client: trx })
        .where('customer_id', customer.id)
        .update({ email: data.email })

      return customer
    })
  }

  async setLocation(customer: Customer, data: CustomerLocationData): Promise<Customer> {
    return customer.merge(data).save()
  }

  async setMarket(customer: Customer, marketId: string): Promise<Customer> {
    return customer.merge({ marketId }).save()
  }

  async setActive(customer: Customer, isActive: boolean): Promise<Customer> {
    return customer.merge({ isActive }).save()
  }

  /**
   * Saves a consent change. A request that doesn't change the choice
   * leaves the recorded time and source alone.
   */
  async setMarketing(
    customer: Customer,
    acceptsMarketing: boolean,
    source: MarketingConsentSource
  ): Promise<Customer> {
    if (customer.acceptsMarketing === acceptsMarketing) return customer
    return customer.merge(marketingConsent(acceptsMarketing, source)).save()
  }

  /**
   * Turns marketing consent on for the profile with `email`, if there is
   * one. Unknown emails and archived profiles are left alone.
   */
  async optInMarketingByEmail(email: string, source: MarketingConsentSource): Promise<void> {
    const customer = await this.findByEmail(email)
    if (customer?.isActive) await this.setMarketing(customer, true, source)
  }

  async tagNames(customerId: string): Promise<string[]> {
    const tags = await CustomerTag.query()
      .where('customer_id', customerId)
      .select('name')
      .orderBy('name', 'asc')
    return tags.map((tag) => tag.name)
  }

  /**
   * Replaces the customer's tags and staff note in one transaction. Only
   * tags that were added or removed are written.
   */
  async setTagsAndNote(customer: Customer, tags: string[], note: string | null): Promise<Customer> {
    return db.transaction(async (trx) => {
      customer.useTransaction(trx)
      await customer.merge({ note }).save()

      const current = await CustomerTag.query({ client: trx })
        .where('customer_id', customer.id)
        .select('name')
      const currentNames = new Set(current.map((tag) => tag.name))
      const wanted = new Set(tags)
      const removed = [...currentNames].filter((name) => !wanted.has(name))
      const added = [...wanted].filter((name) => !currentNames.has(name))

      if (removed.length > 0) {
        await CustomerTag.query({ client: trx })
          .where('customer_id', customer.id)
          .whereIn('name', removed)
          .delete()
      }
      if (added.length > 0) {
        await CustomerTag.createMany(
          added.map((name) => ({ customerId: customer.id, name })),
          { client: trx }
        )
      }
      return customer
    })
  }

  /**
   * Archives (`isActive = false`) or restores the customers in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<Customer[]> {
    return bulkUpdate(Customer, ids, { isActive }, (query) => query.where('is_active', !isActive))
  }
}
