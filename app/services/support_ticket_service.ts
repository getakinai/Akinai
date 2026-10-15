import { createHmac, randomBytes } from 'node:crypto'
import { inject } from '@adonisjs/core'
import encryption from '@adonisjs/core/services/encryption'
import logger from '@adonisjs/core/services/logger'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import {
  MAX_SUPPORT_MESSAGES_PER_TICKET,
  SUPPORT_ACCESS_TOKEN_DAYS,
  SUPPORT_MOBILE_PATTERN,
  type SupportTicketStatus,
} from '#constants/support'
import SupportTicket from '#models/support_ticket'
import type Customer from '#models/customer'
import SupportTicketRepository, {
  type SupportTicketSortKey,
  type SupportTicketUpdateData,
} from '#repositories/support_ticket_repository'
import AuditLogService from '#services/audit_log_service'
import SupportNotificationService from '#services/support_notification_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { absoluteUrl } from '#utils/app_url'
import env from '#start/env'

const TOKEN_PURPOSE = 'support-thread'

export type SupportTicketOpenInput = {
  fullName?: string
  email?: string
  mobile?: string
  concern: string
  transcript?: string[]
}

export type SupportTicketListFilters = {
  q?: string
  status?: SupportTicketStatus
  assigned?: 'me' | 'unassigned'
  sort?: SupportTicketSortKey
  direction?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

/**
 * Support tickets opened from the storefront help chat. Customers and
 * guests reach their thread through a private emailed link: a random token
 * whose HMAC is the lookup key (so a database leak doesn't expose working
 * links) and which is also stored encrypted so later emails can repeat it.
 */
@inject()
export default class SupportTicketService {
  constructor(
    protected supportTicketRepository: SupportTicketRepository,
    protected supportNotificationService: SupportNotificationService,
    protected auditLogService: AuditLogService
  ) {}

  /**
   * `customer` is the signed-in session customer, never anything from the
   * request body. Their profile email is used, so a signed-in customer
   * can't send the thread link to someone else's inbox.
   */
  async open(input: SupportTicketOpenInput, customer: Customer | null) {
    const contact = this.contactFor(input, customer)
    const token = randomBytes(32).toString('base64url')
    const ticket = await this.supportTicketRepository.create(
      {
        customerId: customer?.id ?? null,
        ...contact,
        chatTranscript: input.transcript ?? [],
        accessTokenHash: this.hashToken(token),
        accessTokenEncrypted: String(encryption.encrypt(token, { purpose: TOKEN_PURPOSE })),
        accessTokenExpiresAt: this.tokenExpiry(),
      },
      input.concern
    )
    await this.supportNotificationService.ticketOpened(ticket, input.concern, this.threadUrl(token))
    return ticket
  }

  /** The ticket an emailed link points to. Unknown or expired links are a 404. */
  async findByTokenOrFail(token: string, ipAddress: string | null): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepository.findByAccessTokenHash(this.hashToken(token))
    if (!ticket) {
      logger.warn(
        { event: 'support.thread_link_rejected', ip: ipAddress },
        'Support thread link not found or expired'
      )
      throw new lucidErrors.E_ROW_NOT_FOUND()
    }
    return ticket
  }

  async findForCustomerOrFail(customerId: string, id: string) {
    return this.supportTicketRepository.findForCustomerOrFail(customerId, id)
  }

  /** What the customer sees: never internal staff notes. */
  async customerMessages(ticket: SupportTicket) {
    return this.supportTicketRepository.messages(ticket.id, { internal: false })
  }

  async paginateForCustomer(customerId: string, page = 1, perPage = 10) {
    return this.supportTicketRepository.paginateForCustomer(customerId, page, perPage)
  }

  /** The customer (signed in or through the link) replied. Reopens the ticket. */
  async replyByCustomer(ticket: SupportTicket, body: string) {
    await this.assertRoomForMessage(ticket)
    const result = await this.supportTicketRepository.addMessage(
      ticket.id,
      {
        userId: null,
        customerId: ticket.customerId,
        authorType: 'customer',
        isInternal: false,
        body,
      },
      { status: 'open' }
    )
    await this.supportNotificationService.customerReplied(result.ticket, body)
    return result.message
  }

  async paginateForAdmin(userId: string, filters: SupportTicketListFilters) {
    return this.supportTicketRepository.paginateForAdmin({
      q: filters.q,
      status: filters.status,
      assignedUserId: filters.assigned === 'me' ? userId : undefined,
      unassigned: filters.assigned === 'unassigned',
      sort: filters.sort ?? 'lastMessageAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  async findForAdmin(id: string) {
    const ticket = await this.supportTicketRepository.findOrFail(id)
    const [messages] = await Promise.all([
      this.supportTicketRepository.messages(ticket.id, { internal: true }),
      this.supportTicketRepository.loadForAdmin(ticket),
    ])
    return { ticket, messages }
  }

  /**
   * A staff reply goes to the customer by email and waits on them; an
   * internal note stays in the back office and changes nothing else.
   */
  async replyByStaff(id: string, userId: string, body: string, isInternal: boolean) {
    const ticket = await this.supportTicketRepository.findOrFail(id)
    await this.assertRoomForMessage(ticket)
    const result = await this.supportTicketRepository.addMessage(
      ticket.id,
      { userId, customerId: null, authorType: 'staff', isInternal, body },
      isInternal ? {} : { status: 'pending_customer', accessTokenExpiresAt: this.tokenExpiry() }
    )
    if (!isInternal) {
      const token = encryption.decrypt<string>(result.ticket.accessTokenEncrypted, TOKEN_PURPOSE)
      if (token) {
        await this.supportNotificationService.staffReplied(
          result.ticket,
          body,
          this.threadUrl(token)
        )
      } else {
        logger.error(
          { event: 'support.thread_link_unreadable', ticketId: ticket.id },
          'Could not read the support thread link; the reply was saved but not emailed'
        )
      }
    }
    return this.findForAdmin(ticket.id)
  }

  async update(id: string, data: SupportTicketUpdateData) {
    const ticket = await this.supportTicketRepository.findOrFail(id)
    if (
      data.assignedUserId &&
      !(await this.supportTicketRepository.isAssignable(data.assignedUserId))
    ) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'assignedUserId',
          message: 'Pick a team member who can reply to support requests',
          rule: 'assignable',
        },
      ])
    }
    await this.supportTicketRepository.update(ticket, data)
    return this.findForAdmin(ticket.id)
  }

  async bulkSetStatus(ids: string[], status: SupportTicketStatus): Promise<BulkResult> {
    const changed = await this.supportTicketRepository.setStatusMany(ids, status)
    await this.auditLogService.recordBulkUpdate(SupportTicket, changed, { status })
    return bulkResult(ids, changed)
  }

  async assignableUsers() {
    return this.supportTicketRepository.assignableUsers()
  }

  async openCount() {
    return this.supportTicketRepository.countByStatus('open')
  }

  protected async assertRoomForMessage(ticket: SupportTicket) {
    const count = await this.supportTicketRepository.countMessages(ticket.id)
    if (count >= MAX_SUPPORT_MESSAGES_PER_TICKET) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'body',
          message: 'This conversation is full. Please start a new one from the help chat.',
          rule: 'supportThreadFull',
        },
      ])
    }
  }

  /**
   * Name, email and mobile for a new ticket. A signed-in customer's profile
   * wins over the request; the request only fills what the profile lacks.
   */
  protected contactFor(input: SupportTicketOpenInput, customer: Customer | null) {
    const profilePhone = customer?.phone?.trim()
    const contact = {
      fullName: customer?.fullName?.trim() || input.fullName,
      email: customer?.email ?? input.email,
      mobile:
        profilePhone && SUPPORT_MOBILE_PATTERN.test(profilePhone) ? profilePhone : input.mobile,
    }
    const missing = (
      [
        ['fullName', 'Please enter your full name'],
        ['email', 'Please enter your email address'],
        ['mobile', 'Please enter your mobile number'],
      ] as const
    ).filter(([field]) => !contact[field])
    if (missing.length > 0) {
      throw new errors.E_VALIDATION_ERROR(
        missing.map(([field, message]) => ({ field, message, rule: 'required' }))
      )
    }
    return contact as { fullName: string; email: string; mobile: string }
  }

  protected hashToken(token: string) {
    return createHmac('sha256', env.get('APP_KEY').release())
      .update(`${TOKEN_PURPOSE}:${token}`)
      .digest('hex')
  }

  protected tokenExpiry() {
    return DateTime.now().plus({ days: SUPPORT_ACCESS_TOKEN_DAYS })
  }

  protected threadUrl(token: string) {
    return absoluteUrl(`/support/tickets/${token}`)
  }
}
