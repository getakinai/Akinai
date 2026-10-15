import { inject } from '@adonisjs/core'
import type CustomerAccount from '#models/customer_account'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerOwnershipRepository, {
  type CustomerOwnedResource,
} from '#repositories/customer_ownership_repository'

@inject()
export default class CustomerOwnershipService {
  constructor(
    protected customerAccountRepository: CustomerAccountRepository,
    protected customerOwnershipRepository: CustomerOwnershipRepository
  ) {}

  async accountOwns(
    account: CustomerAccount,
    resource: CustomerOwnedResource,
    id: string
  ): Promise<boolean> {
    const customer = await this.customerAccountRepository.loadCustomer(account)
    return this.customerOwnershipRepository.owns(resource, customer.id, id)
  }
}
