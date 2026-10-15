import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type ProductLabel from '#models/product_label'
import type User from '#models/user'

export default class ProductLabelPolicy extends BasePolicy {
  update(user: User, productLabel: ProductLabel): AuthorizerResponse {
    if (!user.hasPermission('product_labels.edit')) {
      return false
    }
    if (!productLabel.isActive) {
      return AuthorizationResponse.deny('Restore this label before editing it', 422)
    }
    return true
  }

  archive(user: User, productLabel: ProductLabel): AuthorizerResponse {
    if (!user.hasPermission('product_labels.archive')) {
      return false
    }
    if (!productLabel.isActive) {
      return AuthorizationResponse.deny('This label is already archived', 422)
    }
    return true
  }

  unarchive(user: User, productLabel: ProductLabel): AuthorizerResponse {
    if (!user.hasPermission('product_labels.archive')) {
      return false
    }
    if (productLabel.isActive) {
      return AuthorizationResponse.deny('This label is already active', 422)
    }
    return true
  }
}
