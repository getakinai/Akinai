import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type ShippingZone from '#models/shipping_zone'
import type User from '#models/user'

export default class ShippingZonePolicy extends BasePolicy {
  /**
   * Also covers adding, editing and deleting the zone's rates.
   */
  update(user: User, zone: ShippingZone): AuthorizerResponse {
    if (!user.hasPermission('shipping.edit')) {
      return false
    }
    if (!zone.isActive) {
      return AuthorizationResponse.deny('Restore this shipping zone before editing it', 422)
    }
    return true
  }

  archive(user: User, zone: ShippingZone): AuthorizerResponse {
    if (!user.hasPermission('shipping.archive')) {
      return false
    }
    if (!zone.isActive) {
      return AuthorizationResponse.deny('This shipping zone is already archived', 422)
    }
    return true
  }

  unarchive(user: User, zone: ShippingZone): AuthorizerResponse {
    if (!user.hasPermission('shipping.archive')) {
      return false
    }
    if (zone.isActive) {
      return AuthorizationResponse.deny('This shipping zone is already active', 422)
    }
    return true
  }
}
