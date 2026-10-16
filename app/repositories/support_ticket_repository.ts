import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import {
  FIRST_SUPPORT_TICKET_NUMBER,
  SUPPORT_REFERENCE_PREFIX,
  type SupportMessageAuthorType,
  type SupportTicketStatus,
} from '#constants/support'
import SupportTicket from '#models/support_ticket'
import SupportTicketMessage from '#models/support_ticket_message'
import User from '#models/user'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

const NUMBER_LOCK_KEY = 7_340_101

export type SupportTicketCreateData = {
  customerId: string | null
  fullName: string
  email: string
  mobile: string
  chatTranscript: string[]
  accessTokenHash: string
  accessTokenEncrypted: string
  accessTokenExpiresAt: DateTime
}

export type SupportTicketMessageData = {
  userId: string | null
  customerId: string | null
  authorType: SupportMessageAuthorType
  isInternal: boolean
  body: string
}

/** Ticket columns set as a side effect of a new message (not an audited staff edit). */
export type SupportTicketTouch = {
  status?: SupportTicketStatus
  accessTokenExpiresAt?: DateTime
}

export type SupportTicketUpdateData = {
  status?: SupportTicketStatus
  assignedUserId?: string | null
}

export type SupportTicketSortKey = 'lastMessageAt' | 'createdAt' | 'number'

export type PaginateSupportTicketsData = {
  q?: string
  status?: SupportTicketStatus
  assignedUserId?: string
  unassigned?: boolean
  sort: SupportTicketSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<SupportTicketSortKey, string> = {
  lastMessageAt: 'support_tickets.last_message_at',
  createdAt: 'support_tickets.created_at',
  number: 'support_tickets.number',
}

const LIST_COLUMNS = [
  'id',
  'number',
  'customer_id',
  'assigned_user_id',
  'full_name',
  'email',
  'mobile',
  'status',
  'last_message_at',
  'closed_at',
  'created_at',
  'updated_at',
]

export default class SupportTicketRepository {
  /** Saves the ticket and its first message together, with the next ticket number. */
  async create(data: SupportTicketCreateData, body: string): Promise<SupportTicket> {
    return db.transaction(async (trx) => {
      await trx.rawQuery('SELECT pg_advisory_xact_lock(?)', [NUMBER_LOCK_KEY])
      const now = DateTime.now()
      const ticket = await SupportTicket.create(
        {
          ...data,
          number: await this.nextNumber(trx),
          assignedUserId: null,
          status: 'open',
          lastMessageAt: now,
          closedAt: null,
        },
        { client: trx }
      )
      await SupportTicketMessage.create(
        {
          supportTicketId: ticket.id,
          userId: null,
          customerId: data.customerId,
          authorType: 'customer',
          isInternal: false,
          body,
        },
        { client: trx }
      )
      return ticket
    })
  }

  /**
   * Adds a message and moves the ticket along (status, link expiry, last
   * message time). The ticket changes are a side effect of the message, so
   * they are not written to the audit log as an edit.
   */
  async addMessage(
    ticketId: string,
    data: SupportTicketMessageData,
    touch: SupportTicketTouch
  ): Promise<{ ticket: SupportTicket; message: SupportTicketMessage }> {
    return db.transaction(async (trx) => {
      const ticket = await SupportTicket.query({ client: trx })
        .where('id', ticketId)
        .forUpdate()
        .firstOrFail()
      const message = await SupportTicketMessage.create(
        { ...data, supportTicketId: ticket.id },
        { client: trx }
      )
      ticket.$skipAudit = true
      ticket.merge({ lastMessageAt: DateTime.now(), ...touch })
      if (touch.status) ticket.closedAt = touch.status === 'closed' ? DateTime.now() : null
      await ticket.save()
      return { ticket, message }
    })
  }

  /** A staff edit (status, assignee), saved through the model so it is audited. */
  async update(ticket: SupportTicket, data: SupportTicketUpdateData): Promise<SupportTicket> {
    ticket.merge(data)
    if (data.status !== undefined && ticket.$dirty.status !== undefined) {
      ticket.closedAt = data.status === 'closed' ? DateTime.now() : null
    }
    await ticket.save()
    return ticket
  }

  async setStatusMany(ids: string[], status: SupportTicketStatus): Promise<SupportTicket[]> {
    return bulkUpdate(
      SupportTicket,
      ids,
      { status, closedAt: status === 'closed' ? DateTime.now() : null },
      (query) => query.whereNot('status', status)
    )
  }

  async findOrFail(id: string): Promise<SupportTicket> {
    return SupportTicket.findOrFail(id)
  }

  async findForCustomerOrFail(customerId: string, id: string): Promise<SupportTicket> {
    return SupportTicket.query().where('id', id).where('customer_id', customerId).firstOrFail()
  }

  /** The ticket an emailed link points to, while the link is still valid. */
  async findByAccessTokenHash(tokenHash: string): Promise<SupportTicket | null> {
    return SupportTicket.query()
      .where('access_token_hash', tokenHash)
      .where('access_token_expires_at', '>', DateTime.now().toSQL()!)
      .first()
  }

  /** The thread, oldest message first. Internal notes only when asked for. */
  async messages(ticketId: string, { internal }: { internal: boolean }) {
    return SupportTicketMessage.query()
      .where('support_ticket_id', ticketId)
      .if(!internal, (query) => query.where('is_internal', false))
      .preload('user', (user) => user.select('id', 'full_name', 'email'))
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
  }

  async loadForAdmin(ticket: SupportTicket): Promise<SupportTicket> {
    await ticket.load((loader) => {
      loader
        .load('assignedUser', (user) => user.select('id', 'full_name', 'email'))
        .load('customer', (customer) => customer.select('id', 'full_name', 'email'))
    })
    return ticket
  }

  async countMessages(ticketId: string): Promise<number> {
    const row = await db
      .from('support_ticket_messages')
      .where('support_ticket_id', ticketId)
      .count('* as total')
      .first()
    return Number(row?.total ?? 0)
  }

  async countByStatus(status: SupportTicketStatus): Promise<number> {
    const row = await db.from('support_tickets').where('status', status).count('* as total').first()
    return Number(row?.total ?? 0)
  }

  async paginateForAdmin({
    q,
    status,
    assignedUserId,
    unassigned,
    sort,
    direction,
    page,
    perPage,
  }: PaginateSupportTicketsData) {
    return SupportTicket.query()
      .select(LIST_COLUMNS.map((column) => `support_tickets.${column}`))
      .if(q, (query) => {
        const reference = q!.trim().toUpperCase().replace(SUPPORT_REFERENCE_PREFIX, '')
        const number = /^\d+$/.test(reference) ? Number(reference) : null
        query.where((group) => {
          group
            .whereILike('support_tickets.full_name', containsPattern(q))
            .orWhereILike('support_tickets.email', containsPattern(q))
          if (number !== null && number <= 2_147_483_647) {
            group.orWhere('support_tickets.number', number)
          }
        })
      })
      .if(status, (query) => query.where('support_tickets.status', status!))
      .if(assignedUserId, (query) =>
        query.where('support_tickets.assigned_user_id', assignedUserId!)
      )
      .if(unassigned, (query) => query.whereNull('support_tickets.assigned_user_id'))
      .preload('assignedUser', (user) => user.select('id', 'full_name', 'email'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('support_tickets.id', direction)
      .paginate(page, perPage)
  }

  async paginateForCustomer(customerId: string, page: number, perPage: number) {
    return SupportTicket.query()
      .select(LIST_COLUMNS)
      .where('customer_id', customerId)
      .orderBy('last_message_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /** Active staff who may reply to tickets: the locked admin role, or a role granted `support_tickets.edit`. */
  async assignableUsers(): Promise<User[]> {
    return this.assignableQuery()
      .orderBy('users.full_name', 'asc')
      .orderBy('users.email', 'asc')
      .limit(200)
  }

  async isAssignable(userId: string): Promise<boolean> {
    return (await this.assignableQuery().where('users.id', userId).first()) !== null
  }

  protected assignableQuery() {
    return User.query()
      .select('users.id', 'users.full_name', 'users.email')
      .join('roles', 'roles.id', 'users.role_id')
      .where('users.status', 'active')
      .where((query) => {
        query.where('roles.is_locked', true).orWhereExists((permission) => {
          permission
            .from('role_permissions')
            .whereColumn('role_permissions.role_id', 'roles.id')
            .where('role_permissions.permission', 'support_tickets.edit')
        })
      })
  }

  protected async nextNumber(trx: TransactionClientContract): Promise<number> {
    const row = await trx.from('support_tickets').max('number as max').first()
    return Math.max(Number(row?.max ?? 0) + 1, FIRST_SUPPORT_TICKET_NUMBER)
  }
}
