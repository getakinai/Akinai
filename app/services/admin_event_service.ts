import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import type { Permission } from '#abilities/permissions'
import {
  ADMIN_EVENT_CHANNELS,
  ADMIN_EVENT_RETENTION_DAYS,
  ADMIN_EVENT_RETRY_BATCH,
  type AdminEventStatus,
  type AdminEventType,
} from '#constants/admin_events'
import type AdminEvent from '#models/admin_event'
import type { AuditChanges, OrderEventAction } from '#models/audit_log'
import type Order from '#models/order'
import type SupportTicket from '#models/support_ticket'
import type User from '#models/user'
import AdminEventRepository, { type NotificationFilter } from '#repositories/admin_event_repository'
import type { AuditActor } from '#services/audit_actor'
import AdminEventPublisher from '#services/admin_event_publisher'
import { presentOrderEvent } from '#services/admin_event_presenter'
import { orderAuditLabel } from '#services/order_audit'

export type AdminEventListFilters = {
  q?: string
  type?: AdminEventType
  status?: AdminEventStatus
  page?: number
  perPage?: number
}

/**
 * Live notifications for staff. Each event is stored first, then pushed
 * over Redis pub/sub to every app instance and on to browsers (SSE). A
 * failed push is recorded and can be retried; it never fails the action
 * that caused it.
 */
@inject()
export default class AdminEventService {
  constructor(
    protected adminEventRepository: AdminEventRepository,
    protected publisher: AdminEventPublisher
  ) {}

  async recordOrderEvent(
    order: Order,
    action: OrderEventAction,
    changes: AuditChanges,
    actor: AuditActor
  ): Promise<AdminEvent | null> {
    const presented = presentOrderEvent(order, action, changes)
    if (!presented) return null

    const customerId = actor.customerId ?? null
    const event = await this.adminEventRepository.create({
      ...presented,
      channel: 'admin/orders',
      permission: ADMIN_EVENT_CHANNELS['admin/orders'],
      subjectType: 'Order',
      subjectId: order.id,
      subjectLabel: orderAuditLabel(order),
      orderId: order.id,
      actorType: actor.userId ? 'user' : customerId ? 'customer' : 'system',
      actorUserId: actor.userId,
      actorCustomerId: actor.userId ? null : customerId,
      actorLabel: await this.adminEventRepository.actorName({
        userId: actor.userId,
        customerId,
      }),
    })
    await this.deliver(event)
    return event
  }

  /**
   * A customer or guest opened or replied to a support ticket. Guests have
   * no account, so the actor label is the name they typed.
   */
  async recordSupportEvent(
    ticket: SupportTicket,
    type: Extract<AdminEventType, 'support.ticket_created' | 'support.ticket_replied'>
  ): Promise<AdminEvent> {
    const event = await this.adminEventRepository.create({
      type,
      channel: 'admin/support',
      permission: ADMIN_EVENT_CHANNELS['admin/support'],
      title:
        type === 'support.ticket_created'
          ? `sent support request ${ticket.reference}`
          : `replied to support request ${ticket.reference}`,
      details: { reference: ticket.reference },
      subjectType: 'SupportTicket',
      subjectId: ticket.id,
      subjectLabel: ticket.reference,
      orderId: null,
      actorType: 'customer',
      actorUserId: null,
      actorCustomerId: ticket.customerId,
      actorLabel: ticket.fullName.slice(0, 255),
    })
    await this.deliver(event)
    return event
  }

  async deliver(event: AdminEvent): Promise<boolean> {
    try {
      await this.publisher.publish({ channel: event.channel, payload: this.payload(event) })
      await this.adminEventRepository.markDelivered(event.id)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.adminEventRepository.markFailed(event.id, message)
      logger.warn(
        { err: error, event: 'admin_event.delivery_failed', adminEventId: event.id },
        'Could not push an admin notification'
      )
      return false
    }
  }

  async retry(event: AdminEvent): Promise<AdminEvent> {
    await this.deliver(event)
    return this.adminEventRepository.findOrFail(event.id)
  }

  /** Re-sends the oldest failed events (capped per call). */
  async retryFailed(): Promise<{ retried: number; delivered: number }> {
    const events = await this.adminEventRepository.failed(ADMIN_EVENT_RETRY_BATCH)
    let delivered = 0
    for (const event of events) {
      if (await this.deliver(event)) delivered += 1
    }
    return { retried: events.length, delivered }
  }

  async findOrFail(id: string) {
    return this.adminEventRepository.findOrFail(id)
  }

  async paginate({ page, perPage, ...filters }: AdminEventListFilters) {
    return this.adminEventRepository.paginate({
      ...filters,
      page: page ?? 1,
      perPage: perPage ?? 25,
    })
  }

  async notifications(
    user: User,
    { filter, page, perPage }: { filter?: NotificationFilter; page?: number; perPage?: number }
  ) {
    const permissions = this.permissionsFor(user)
    const [events, badge] = await Promise.all([
      this.adminEventRepository.notifications({
        userId: user.id,
        permissions,
        filter: filter ?? 'all',
        page: page ?? 1,
        perPage: perPage ?? 15,
      }),
      this.adminEventRepository.badgeCount(user, permissions),
    ])
    return { events, badge, seenAt: user.notificationsSeenAt }
  }

  async markSeen(user: User): Promise<DateTime> {
    return this.adminEventRepository.markSeen(user.id)
  }

  async markRead(user: User, eventId: string): Promise<boolean> {
    return this.adminEventRepository.markRead(user.id, eventId, this.permissionsFor(user))
  }

  async markAllRead(user: User): Promise<number> {
    return this.adminEventRepository.markAllRead(user.id, this.permissionsFor(user))
  }

  async prune(): Promise<number> {
    return this.adminEventRepository.pruneBefore(
      DateTime.now().minus({ days: ADMIN_EVENT_RETENTION_DAYS })
    )
  }

  /** What the browser gets over SSE: no customer emails or addresses. */
  payload(event: AdminEvent) {
    return {
      id: event.id,
      type: event.type,
      title: event.title,
      subjectType: event.subjectType,
      subjectId: event.subjectId,
      subjectLabel: event.subjectLabel,
      orderId: event.orderId,
      actorType: event.actorType,
      actorLabel: event.actorLabel,
      createdAt: event.createdAt.toISO(),
    }
  }

  /** Permissions that gate notifications, which the user holds. */
  protected permissionsFor(user: User): Permission[] {
    return [...new Set(Object.values(ADMIN_EVENT_CHANNELS))].filter((permission) =>
      user.hasPermission(permission)
    )
  }
}
