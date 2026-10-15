import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Product from '#models/product'
import type ProductVariant from '#models/product_variant'
import type User from '#models/user'

const ARCHIVED_MESSAGE = 'Unarchive this product before editing it'

export default class ProductPolicy extends BasePolicy {
  update(user: User, product: Product): AuthorizerResponse {
    if (!user.hasPermission('products.edit')) {
      return false
    }
    if (product.isArchived) {
      return AuthorizationResponse.deny(ARCHIVED_MESSAGE, 422)
    }
    return true
  }

  archive(user: User, product: Product): AuthorizerResponse {
    if (!user.hasPermission('products.archive')) {
      return false
    }
    if (product.isArchived) {
      return AuthorizationResponse.deny('This product is already archived', 422)
    }
    return true
  }

  unarchive(user: User, product: Product): AuthorizerResponse {
    if (!user.hasPermission('products.archive')) {
      return false
    }
    if (!product.isArchived) {
      return AuthorizationResponse.deny('This product is not archived', 422)
    }
    return true
  }

  /**
   * Expects `product.options` to be preloaded. A product without options
   * keeps its single default variant.
   */
  createVariant(user: User, product: Product): AuthorizerResponse {
    const canUpdate = this.update(user, product)
    if (canUpdate !== true) {
      return canUpdate
    }
    if (product.options.length === 0) {
      return AuthorizationResponse.deny('Add an option before adding variants', 422)
    }
    return true
  }

  /**
   * Expects `variant.product` to be preloaded.
   */
  updateVariant(user: User, variant: ProductVariant): AuthorizerResponse {
    return this.update(user, variant.product)
  }

  /**
   * Expects `variant.product.variants` to be preloaded.
   */
  deleteVariant(user: User, variant: ProductVariant): AuthorizerResponse {
    const canUpdate = this.update(user, variant.product)
    if (canUpdate !== true) {
      return canUpdate
    }
    if (variant.product.variants.length <= 1) {
      return AuthorizationResponse.deny('A product needs at least one variant', 422)
    }
    return true
  }

  /**
   * Expects `variant.product` to be preloaded.
   */
  editInventory(user: User, variant: ProductVariant): AuthorizerResponse {
    if (!user.hasPermission('inventory.edit')) {
      return false
    }
    if (variant.product.isArchived) {
      return AuthorizationResponse.deny(ARCHIVED_MESSAGE, 422)
    }
    if (!variant.trackInventory) {
      return AuthorizationResponse.deny('Turn on inventory tracking for this variant first', 422)
    }
    return true
  }
}
