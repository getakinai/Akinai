import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Order from '#models/order'
import type User from '#models/user'

const COMPLETED = 'This order is already completed'

export default class OrderPolicy extends BasePolicy {
  update(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (!order.isDraft) {
      return AuthorizationResponse.deny(COMPLETED, 422)
    }
    return true
  }

  delete(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.archive')) {
      return false
    }
    if (!order.isDraft) {
      return AuthorizationResponse.deny('Completed orders cannot be deleted', 422)
    }
    return true
  }

  editPlaced(user: User, order: Order): AuthorizerResponse {
    if (!user.isAdmin || !user.hasPermission('orders.edit')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Edit drafts from the draft order page', 422)
    }
    if (!order.isEditablePlaced) {
      return AuthorizationResponse.deny(
        'Only orders awaiting payment or paid by bank transfer can be edited',
        422
      )
    }
    return true
  }

  fulfill(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Complete the draft before fulfilling it', 422)
    }
    if (order.isCancelled) {
      return AuthorizationResponse.deny('Cancelled orders can’t be fulfilled', 422)
    }
    return true
  }

  refund(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('refunds.create')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Drafts have no payment to refund', 422)
    }
    if (!order.isPaid) {
      return AuthorizationResponse.deny('This order has no payment to refund', 422)
    }
    if (order.refundableTotal <= 0) {
      return AuthorizationResponse.deny('This order is already fully refunded', 422)
    }
    return true
  }

  addNote(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Complete the draft before adding notes', 422)
    }
    return true
  }

  createReturn(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (order.status !== 'open') {
      return AuthorizationResponse.deny('Only open orders can have returns', 422)
    }
    return true
  }

  /** Active fulfillments are checked by OrderCancelService, which loads them. */
  cancel(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('refunds.create')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Delete the draft instead of cancelling it', 422)
    }
    if (order.isCancelled) {
      return AuthorizationResponse.deny('This order is already cancelled', 422)
    }
    return true
  }

  archive(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.archive')) {
      return false
    }
    if (order.isDraft) {
      return AuthorizationResponse.deny('Drafts cannot be archived', 422)
    }
    if (order.archivedAt) {
      return AuthorizationResponse.deny('This order is already archived', 422)
    }
    return true
  }

  unarchive(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.archive')) {
      return false
    }
    if (!order.archivedAt) {
      return AuthorizationResponse.deny('This order is not archived', 422)
    }
    return true
  }

  complete(user: User, order: Order): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (!order.isDraft) {
      return AuthorizationResponse.deny(COMPLETED, 422)
    }
    return true
  }
}
