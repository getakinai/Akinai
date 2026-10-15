import { inject } from '@adonisjs/core'
import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Location from '#models/location'
import type User from '#models/user'
import LocationService from '#services/location_service'

@inject()
export default class LocationPolicy extends BasePolicy {
  constructor(protected locationService: LocationService) {
    super()
  }

  update(user: User): AuthorizerResponse {
    return user.hasPermission('locations.edit')
  }

  async archive(user: User, location: Location): Promise<AuthorizerResponse> {
    if (!user.hasPermission('locations.archive')) {
      return false
    }
    if (location.isDefault) {
      return AuthorizationResponse.deny('The default location cannot be archived', 422)
    }
    if (!location.isActive) {
      return AuthorizationResponse.deny('This location is already archived', 422)
    }
    if ((await this.locationService.totalUnits(location)) > 0) {
      return AuthorizationResponse.deny(
        'Move or zero out the stock at this location before archiving it',
        422
      )
    }
    return true
  }

  unarchive(user: User, location: Location): AuthorizerResponse {
    if (!user.hasPermission('locations.archive')) {
      return false
    }
    if (location.isActive) {
      return AuthorizationResponse.deny('This location is already active', 422)
    }
    return true
  }
}
