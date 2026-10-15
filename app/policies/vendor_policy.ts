import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import type Vendor from '#models/vendor'

export default class VendorPolicy extends BasePolicy {
  update(user: User, vendor: Vendor): AuthorizerResponse {
    if (!user.hasPermission('vendors.edit')) {
      return false
    }
    if (!vendor.isActive) {
      return AuthorizationResponse.deny('Restore this vendor before editing it', 422)
    }
    return true
  }

  upload(user: User, vendor: Vendor): AuthorizerResponse {
    if (!user.hasPermission('vendors.upload')) {
      return false
    }
    if (!vendor.isActive) {
      return AuthorizationResponse.deny('Restore this vendor before changing its image', 422)
    }
    return true
  }

  archive(user: User, vendor: Vendor): AuthorizerResponse {
    if (!user.hasPermission('vendors.archive')) {
      return false
    }
    if (!vendor.isActive) {
      return AuthorizationResponse.deny('This vendor is already archived', 422)
    }
    return true
  }

  unarchive(user: User, vendor: Vendor): AuthorizerResponse {
    if (!user.hasPermission('vendors.archive')) {
      return false
    }
    if (vendor.isActive) {
      return AuthorizationResponse.deny('This vendor is already active', 422)
    }
    return true
  }
}
