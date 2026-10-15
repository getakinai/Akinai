import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Market from '#models/market'
import type User from '#models/user'

export default class MarketPolicy extends BasePolicy {
  update(user: User, market: Market): AuthorizerResponse {
    if (!user.hasPermission('markets.edit')) {
      return false
    }
    if (!market.isActive) {
      return AuthorizationResponse.deny('Unarchive this market before editing it', 422)
    }
    return true
  }

  archive(user: User, market: Market): AuthorizerResponse {
    if (!user.hasPermission('markets.archive')) {
      return false
    }
    if (market.isPrimary) {
      return AuthorizationResponse.deny('The primary market cannot be archived', 422)
    }
    if (!market.isActive) {
      return AuthorizationResponse.deny('This market is already archived', 422)
    }
    return true
  }

  unarchive(user: User, market: Market): AuthorizerResponse {
    if (!user.hasPermission('markets.archive')) {
      return false
    }
    if (market.isActive) {
      return AuthorizationResponse.deny('This market is already active', 422)
    }
    return true
  }
}
