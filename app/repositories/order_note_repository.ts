import type { OrderNoteVisibility } from '#constants/order_notes'
import OrderNote from '#models/order_note'

export type OrderNoteCreateData = {
  orderId: string
  userId: string
  visibility: OrderNoteVisibility
  body: string
}

export type OrderNoteReplyData = {
  orderId: string
  customerId: string
  parentId: string
  body: string
}

export default class OrderNoteRepository {
  async create(data: OrderNoteCreateData): Promise<OrderNote> {
    const note = await OrderNote.create(data)
    return this.findWithAuthorOrFail(note.id)
  }

  async createReply(data: OrderNoteReplyData): Promise<OrderNote> {
    return OrderNote.create({ ...data, userId: null, visibility: 'customer' })
  }

  async findWithAuthorOrFail(id: string): Promise<OrderNote> {
    return OrderNote.query()
      .where('id', id)
      .preload('user', (query) => query.select('id', 'full_name', 'email'))
      .preload('replies', (query) =>
        query
          .orderBy('created_at', 'asc')
          .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      )
      .firstOrFail()
  }

  /** A customer-visible staff note on the order that the customer may reply to. */
  async findRepliableForCustomer(orderId: string, noteId: string): Promise<OrderNote | null> {
    return OrderNote.query()
      .where('id', noteId)
      .where('order_id', orderId)
      .where('visibility', 'customer')
      .whereNull('parent_id')
      .whereNotNull('user_id')
      .first()
  }

  async countReplies(parentId: string): Promise<number> {
    const row = await OrderNote.query().where('parent_id', parentId).count('* as total').first()
    return Number(row?.$extras.total ?? 0)
  }

  async listForAdmin(orderId: string): Promise<OrderNote[]> {
    return OrderNote.query()
      .where('order_id', orderId)
      .whereNull('parent_id')
      .preload('user', (query) => query.select('id', 'full_name', 'email'))
      .preload('replies', (query) =>
        query
          .orderBy('created_at', 'asc')
          .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      )
      .orderBy('created_at', 'desc')
      .limit(200)
  }

  async listForCustomer(orderId: string): Promise<OrderNote[]> {
    return OrderNote.query()
      .where('order_id', orderId)
      .where('visibility', 'customer')
      .whereNull('parent_id')
      .preload('replies', (query) => query.orderBy('created_at', 'asc'))
      .orderBy('created_at', 'desc')
      .limit(200)
  }
}
