import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Discount from '#models/discount'
import type User from '#models/user'

export default class DiscountPolicy extends BasePolicy {
  update(user: User, discount: Discount): AuthorizerResponse {
    if (!user.hasPermission('discounts.edit')) {
      return false
    }
    if (discount.archivedAt) {
      return AuthorizationResponse.deny('Restore this discount before editing it', 422)
    }
    return true
  }

  archive(user: User, discount: Discount): AuthorizerResponse {
    if (!user.hasPermission('discounts.archive')) {
      return false
    }
    if (discount.archivedAt) {
      return AuthorizationResponse.deny('This discount is already archived', 422)
    }
    return true
  }

  unarchive(user: User, discount: Discount): AuthorizerResponse {
    if (!user.hasPermission('discounts.archive')) {
      return false
    }
    if (!discount.archivedAt) {
      return AuthorizationResponse.deny('This discount is not archived', 422)
    }
    return true
  }
}
