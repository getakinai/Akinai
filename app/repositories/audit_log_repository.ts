import type { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { LucidModel, LucidRow, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import AuditLog, { type AuditAction, type AuditChanges } from '#models/audit_log'
import { containsPattern } from '#repositories/helpers/like'

export type CreateAuditLogData = {
  userId: string | null
  customerId?: string | null
  action: AuditAction
  auditableType: string
  auditableId: string
  auditableLabel: string | null
  changes: AuditChanges
  ipAddress: string | null
}

/** Optional filters for the back-office activity feeds. */
export type ActivityFilters = {
  q?: string
  action?: AuditAction
  dateFrom?: DateTime
  dateTo?: DateTime
}

export type PaginateUserAuditLogsData = ActivityFilters & {
  userId: string
  page: number
  perPage: number
}

export type PaginateRecordAuditLogsData = ActivityFilters & {
  auditableType: string
  auditableId: string
  page: number
  perPage: number
}

export type PaginateProductAuditLogsData = ActivityFilters & {
  productId: string
  /** The product's current variants. */
  variantIds: string[]
  page: number
  perPage: number
}

export type PaginateCustomerAuditLogsData = {
  customerId: string
  page: number
  perPage: number
}

/** Destructive actions customers see in their account activity. */
export const CUSTOMER_VISIBLE_ACTIONS: AuditAction[] = ['updated', 'deleted']

export default class AuditLogRepository {
  /**
   * Pass the audited record's transaction so the log rolls back with it.
   */
  async create(data: CreateAuditLogData, trx?: TransactionClientContract): Promise<AuditLog> {
    return AuditLog.create(data, trx ? { client: trx } : undefined)
  }

  /**
   * Inserts many log rows in one statement, for bulk actions.
   */
  async createMany(data: CreateAuditLogData[], trx?: TransactionClientContract): Promise<void> {
    if (data.length === 0) return
    await AuditLog.createMany(data, trx ? { client: trx } : undefined)
  }

  /**
   * Looks up a referenced record (a belongs-to target) to name it in a log.
   */
  async findReferenced(
    Model: LucidModel,
    id: string,
    trx?: TransactionClientContract
  ): Promise<LucidRow | null> {
    return Model.find(id, trx ? { client: trx } : undefined)
  }

  /**
   * Updates and deletes the customer made in their own account, newest
   * first.
   */
  async paginateForCustomer({ customerId, page, perPage }: PaginateCustomerAuditLogsData) {
    return AuditLog.query()
      .where('customer_id', customerId)
      .whereIn('action', CUSTOMER_VISIBLE_ACTIONS)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /** A record's history, newest first, with the staff user or customer who made each change. */
  async paginateForRecord({
    auditableType,
    auditableId,
    page,
    perPage,
    ...filters
  }: PaginateRecordAuditLogsData) {
    const query = AuditLog.query()
      .where('auditable_type', auditableType)
      .where('auditable_id', auditableId)
      .preload('user', (users) => users.select('id', 'full_name', 'email'))
      .preload('customer', (customers) => customers.select('id', 'full_name', 'email'))
    return this.applyActivityFilters(query, filters)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /**
   * A product's history together with its variants', newest first. Deleted
   * variants are matched through the `productId` kept in their snapshot,
   * since their ids are no longer on the product.
   */
  async paginateForProduct({
    productId,
    variantIds,
    page,
    perPage,
    ...filters
  }: PaginateProductAuditLogsData) {
    const query = AuditLog.query()
      .where((scope) => {
        scope
          .where((product) =>
            product.where('auditable_type', 'Product').where('auditable_id', productId)
          )
          .if(variantIds.length > 0, (builder) =>
            builder.orWhere((variants) =>
              variants.where('auditable_type', 'ProductVariant').whereIn('auditable_id', variantIds)
            )
          )
          .orWhere((deleted) =>
            deleted
              .where('auditable_type', 'ProductVariant')
              .where('action', 'deleted')
              .whereRaw("changes->'before'->>'productId' = ?", [productId])
          )
      })
      .preload('user', (users) => users.select('id', 'full_name', 'email'))
      .preload('customer', (customers) => customers.select('id', 'full_name', 'email'))
    return this.applyActivityFilters(query, filters)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /**
   * Everything about a customer for the back office, newest first: changes
   * to their profile (by staff or themselves), sign-ins, impersonations, and
   * every change made while signed in as them.
   */
  async paginateCustomerHistory({
    customerId,
    page,
    perPage,
    ...filters
  }: ActivityFilters & PaginateCustomerAuditLogsData) {
    const query = AuditLog.query()
      .where((scope) => {
        scope
          .where('customer_id', customerId)
          .orWhere((profile) =>
            profile.where('auditable_type', 'Customer').where('auditable_id', customerId)
          )
      })
      .preload('user', (users) => users.select('id', 'full_name', 'email'))
      .preload('customer', (customers) => customers.select('id', 'full_name', 'email'))
    return this.applyActivityFilters(query, filters)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  async paginateForUser({ userId, page, perPage, ...filters }: PaginateUserAuditLogsData) {
    const query = AuditLog.query().where('user_id', userId)
    return this.applyActivityFilters(query, filters)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /**
   * `q` matches text anywhere in the before / after values. `dateTo` is
   * inclusive of the whole day.
   */
  protected applyActivityFilters(
    query: ModelQueryBuilderContract<typeof AuditLog>,
    { q, action, dateFrom, dateTo }: ActivityFilters
  ) {
    return query
      .if(action, (builder) => builder.where('action', action!))
      .if(dateFrom, (builder) =>
        builder.where('created_at', '>=', dateFrom!.startOf('day').toSQL()!)
      )
      .if(dateTo, (builder) =>
        builder.where('created_at', '<', dateTo!.startOf('day').plus({ days: 1 }).toSQL()!)
      )
      .if(q, (builder) =>
        builder.whereRaw("jsonb_build_array(changes->'before', changes->'after')::text ILIKE ?", [
          containsPattern(q),
        ])
      )
  }
}
