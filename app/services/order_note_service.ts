import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import { MAX_ORDER_NOTE_REPLIES, type OrderNoteVisibility } from '#constants/order_notes'
import type Order from '#models/order'
import OrderNoteRepository from '#repositories/order_note_repository'
import AuditLogService from '#services/audit_log_service'
import OrderNotificationService from '#services/order_notification_service'

const excerpt = (value: string) => (value.length > 120 ? `${value.slice(0, 117)}…` : value)

export type OrderNoteStorePayload = {
  visibility: OrderNoteVisibility
  body: string
}

@inject()
export default class OrderNoteService {
  constructor(
    protected orderNoteRepository: OrderNoteRepository,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  listForAdmin(orderId: string) {
    return this.orderNoteRepository.listForAdmin(orderId)
  }

  listForCustomer(orderId: string) {
    return this.orderNoteRepository.listForCustomer(orderId)
  }

  async create(order: Order, userId: string, payload: OrderNoteStorePayload) {
    const note = await this.orderNoteRepository.create({
      orderId: order.id,
      userId,
      visibility: payload.visibility,
      body: payload.body,
    })

    await this.auditLogService.recordOrderEvent(order, 'note_added', {
      before: {},
      after: {
        visibility: payload.visibility,
        note: excerpt(payload.body),
      },
    })

    if (payload.visibility === 'customer') {
      await this.orderNotificationService.noteAdded(order.id, payload.body)
    }

    return note
  }

  /**
   * The customer answers a staff note they can see. Replies to internal
   * notes, other orders' notes or other replies are rejected.
   */
  async replyByCustomer(order: Order, customerId: string, parentId: string, body: string) {
    const parent = await this.orderNoteRepository.findRepliableForCustomer(order.id, parentId)
    if (!parent) {
      throw new errors.E_VALIDATION_ERROR([
        { field: 'parentId', message: 'You can’t reply to this note', rule: 'orderNote' },
      ])
    }
    if ((await this.orderNoteRepository.countReplies(parent.id)) >= MAX_ORDER_NOTE_REPLIES) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'parentId',
          message: 'This note has too many replies. Contact the store for more help.',
          rule: 'orderNoteReplies',
        },
      ])
    }

    const reply = await this.orderNoteRepository.createReply({
      orderId: order.id,
      customerId,
      parentId: parent.id,
      body,
    })

    await this.auditLogService.recordOrderEvent(order, 'note_added', {
      before: {},
      after: { visibility: 'customer', reply: true, note: excerpt(body) },
    })
    await this.orderNotificationService.noteReplied(order.id, body)

    return reply
  }
}
