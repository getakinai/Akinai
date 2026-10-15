import type { DateTime } from 'luxon'
import EmailLog, { type EmailLogStatus } from '#models/email_log'
import { containsPattern } from '#repositories/helpers/like'

export type CreateEmailLogData = {
  type: string
  subject: string
  fromAddress: string | null
  toAddresses: string[]
  ccAddresses: string[] | null
  bccAddresses: string[] | null
  html: string | null
  text: string | null
  redacted: boolean
  orderId: string | null
  customerId: string | null
  resentFromId: string | null
  resentByUserId: string | null
}

export type EmailLogSortKey = 'createdAt' | 'subject' | 'type' | 'status'

export type PaginateEmailLogsData = {
  q?: string
  status?: EmailLogStatus
  type?: string
  orderId?: string
  customerId?: string
  sort: EmailLogSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<EmailLogSortKey, string> = {
  createdAt: 'created_at',
  subject: 'subject',
  type: 'type',
  status: 'status',
}

/** Columns for list rows; bodies are only loaded on the detail view. */
const LIST_COLUMNS = [
  'id',
  'type',
  'subject',
  'to_addresses',
  'status',
  'error',
  'redacted',
  'sent_at',
  'order_id',
  'customer_id',
  'resent_from_id',
  'created_at',
  'updated_at',
]

export default class EmailLogRepository {
  async create(data: CreateEmailLogData): Promise<EmailLog> {
    return EmailLog.create({ ...data, status: 'queued', error: null, sentAt: null })
  }

  async markSent(id: string, sentAt: DateTime, providerMessageId: string | null): Promise<void> {
    await EmailLog.query()
      .where('id', id)
      .update({ status: 'sent', sent_at: sentAt.toSQL(), provider_message_id: providerMessageId })
  }

  async markFailed(id: string, error: string): Promise<void> {
    await EmailLog.query()
      .where('id', id)
      .update({ status: 'failed', error: error.slice(0, 500) })
  }

  async paginate({
    q,
    status,
    type,
    orderId,
    customerId,
    sort,
    direction,
    page,
    perPage,
  }: PaginateEmailLogsData) {
    return EmailLog.query()
      .select(LIST_COLUMNS)
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('subject', containsPattern(q))
            .orWhereRaw('to_addresses::text ilike ?', [containsPattern(q)])
        })
      })
      .if(status, (query) => query.where('status', status!))
      .if(type, (query) => query.where('type', type!))
      .if(orderId, (query) => query.where('order_id', orderId!))
      .if(customerId, (query) => query.where('customer_id', customerId!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  /** Latest emails for one order or customer (order/customer page cards). */
  async recentFor(
    scope: { orderId: string } | { customerId: string },
    limit: number
  ): Promise<EmailLog[]> {
    const query = EmailLog.query().select(LIST_COLUMNS)
    if ('orderId' in scope) query.where('order_id', scope.orderId)
    else query.where('customer_id', scope.customerId)
    return query.orderBy('created_at', 'desc').orderBy('id', 'desc').limit(limit)
  }

  async findOrFail(id: string): Promise<EmailLog> {
    return EmailLog.findOrFail(id)
  }

  /** Deletes logs created before the cutoff. Returns the number removed. */
  async deleteOlderThan(cutoff: DateTime): Promise<number> {
    const deleted = await EmailLog.query().where('created_at', '<', cutoff.toSQL()!).delete()
    return Number(Array.isArray(deleted) ? deleted[0] : deleted)
  }
}
