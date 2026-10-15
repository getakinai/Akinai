import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Collection from '#models/collection'
import type User from '#models/user'

export default class CollectionPolicy extends BasePolicy {
  update(user: User, collection: Collection): AuthorizerResponse {
    if (!user.hasPermission('collections.edit')) {
      return false
    }
    if (collection.isArchived) {
      return AuthorizationResponse.deny('Unarchive this collection before editing it', 422)
    }
    return true
  }

  archive(user: User, collection: Collection): AuthorizerResponse {
    if (!user.hasPermission('collections.archive')) {
      return false
    }
    if (collection.isArchived) {
      return AuthorizationResponse.deny('This collection is already archived', 422)
    }
    return true
  }

  unarchive(user: User, collection: Collection): AuthorizerResponse {
    if (!user.hasPermission('collections.archive')) {
      return false
    }
    if (!collection.isArchived) {
      return AuthorizationResponse.deny('This collection is not archived', 422)
    }
    return true
  }

  /**
   * Adding and removing products only applies to manual collections;
   * automated ones are defined by their conditions.
   */
  editProducts(user: User, collection: Collection): AuthorizerResponse {
    const canUpdate = this.update(user, collection)
    if (canUpdate !== true) {
      return canUpdate
    }
    if (!collection.isManual) {
      return AuthorizationResponse.deny(
        'Products in an automated collection come from its conditions',
        422
      )
    }
    return true
  }

  reorderProducts(user: User, collection: Collection): AuthorizerResponse {
    const canEdit = this.editProducts(user, collection)
    if (canEdit !== true) {
      return canEdit
    }
    if (collection.sortOrder !== 'manual') {
      return AuthorizationResponse.deny('Set the sort order to Manual to reorder products', 422)
    }
    return true
  }
}
