import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type ProductType from '#models/product_type'
import type User from '#models/user'

export default class ProductTypePolicy extends BasePolicy {
  update(user: User, productType: ProductType): AuthorizerResponse {
    if (!user.hasPermission('product_types.edit')) {
      return false
    }
    if (!productType.isActive) {
      return AuthorizationResponse.deny('Restore this product type before editing it', 422)
    }
    return true
  }

  archive(user: User, productType: ProductType): AuthorizerResponse {
    if (!user.hasPermission('product_types.archive')) {
      return false
    }
    if (!productType.isActive) {
      return AuthorizationResponse.deny('This product type is already archived', 422)
    }
    return true
  }

  unarchive(user: User, productType: ProductType): AuthorizerResponse {
    if (!user.hasPermission('product_types.archive')) {
      return false
    }
    if (productType.isActive) {
      return AuthorizationResponse.deny('This product type is already active', 422)
    }
    return true
  }
}
