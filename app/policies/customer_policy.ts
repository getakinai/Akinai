import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import type User from '#models/user'

export default class CustomerPolicy extends BasePolicy {
  update(user: User, customer: Customer): AuthorizerResponse {
    if (!user.hasPermission('customers.edit')) {
      return false
    }
    if (!customer.isActive) {
      return AuthorizationResponse.deny('Unarchive this customer to make changes', 422)
    }
    return true
  }

  archive(user: User, customer: Customer): AuthorizerResponse {
    if (!user.hasPermission('customers.archive')) {
      return false
    }
    if (!customer.isActive) {
      return AuthorizationResponse.deny('This customer is already archived', 422)
    }
    return true
  }

  impersonate(user: User, customer: Customer, account: CustomerAccount | null): AuthorizerResponse {
    if (!user.hasPermission('customers.view')) {
      return false
    }
    if (!customer.isActive) {
      return AuthorizationResponse.deny('Unarchive this customer to sign in as them', 422)
    }
    if (!account) {
      return AuthorizationResponse.deny('This customer has no storefront account', 422)
    }
    return true
  }

  unarchive(user: User, customer: Customer): AuthorizerResponse {
    if (!user.hasPermission('customers.archive')) {
      return false
    }
    if (customer.isActive) {
      return AuthorizationResponse.deny('This customer is already active', 422)
    }
    return true
  }
}
