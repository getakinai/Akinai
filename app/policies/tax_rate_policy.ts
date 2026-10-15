import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type TaxRate from '#models/tax_rate'
import type User from '#models/user'

export default class TaxRatePolicy extends BasePolicy {
  update(user: User, taxRate: TaxRate): AuthorizerResponse {
    if (!user.hasPermission('taxes.edit')) {
      return false
    }
    if (!taxRate.isActive) {
      return AuthorizationResponse.deny('Restore this tax rate before editing it', 422)
    }
    return true
  }

  archive(user: User, taxRate: TaxRate): AuthorizerResponse {
    if (!user.hasPermission('taxes.archive')) {
      return false
    }
    if (!taxRate.isActive) {
      return AuthorizationResponse.deny('This tax rate is already archived', 422)
    }
    return true
  }

  unarchive(user: User, taxRate: TaxRate): AuthorizerResponse {
    if (!user.hasPermission('taxes.archive')) {
      return false
    }
    if (taxRate.isActive) {
      return AuthorizationResponse.deny('This tax rate is already active', 422)
    }
    return true
  }
}
