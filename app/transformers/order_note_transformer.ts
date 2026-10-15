import type OrderNote from '#models/order_note'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Top-level notes carry their customer replies (needs the `replies`
 * preload). Staff see who wrote each entry; customers only see whether an
 * entry is theirs.
 */
export default class OrderNoteTransformer extends BaseTransformer<OrderNote> {
  protected replies() {
    return 'replies' in this.resource.$preloaded ? this.resource.replies : []
  }

  toObject() {
    const user = 'user' in this.resource.$preloaded ? this.resource.user : null
    return {
      ...this.pick(this.resource, ['id', 'visibility', 'body', 'createdAt']),
      author: user ? (user.fullName ?? user.email) : null,
      replies: this.replies().map((reply) => {
        const customer = 'customer' in reply.$preloaded ? reply.customer : null
        return {
          id: reply.id,
          body: reply.body,
          createdAt: reply.createdAt.toISO(),
          author: customer ? (customer.fullName ?? customer.email) : 'Customer',
        }
      }),
    }
  }

  toCustomer() {
    return {
      ...this.pick(this.resource, ['id', 'body', 'createdAt']),
      fromCustomer: this.resource.isFromCustomer,
      replies: this.replies().map((reply) => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt.toISO(),
        fromCustomer: reply.isFromCustomer,
      })),
    }
  }
}
