import { inject } from '@adonisjs/core'
import type Customer from '#models/customer'
import type CustomerAddress from '#models/customer_address'
import CustomerAddressRepository, {
  type CustomerAddressData,
} from '#repositories/customer_address_repository'
import { requireRegion } from '#services/helpers/address_region'

@inject()
export default class CustomerAddressService {
  constructor(protected customerAddressRepository: CustomerAddressRepository) {}

  async listFor(customer: Customer): Promise<CustomerAddress[]> {
    return this.customerAddressRepository.listForCustomer(customer.id)
  }

  async findForCustomerOrFail(customerId: string, id: string): Promise<CustomerAddress> {
    return this.customerAddressRepository.findForCustomerOrFail(customerId, id)
  }

  async create(customer: Customer, data: CustomerAddressData): Promise<CustomerAddress> {
    return this.customerAddressRepository.create(customer.id, normalized(data))
  }

  async update(address: CustomerAddress, data: CustomerAddressData): Promise<CustomerAddress> {
    return this.customerAddressRepository.update(address, normalized(data))
  }

  async delete(address: CustomerAddress): Promise<void> {
    return this.customerAddressRepository.delete(address)
  }
}

/**
 * Uppercases the country and, for countries with a region list, requires
 * a listed province (stored with its catalog name and code).
 */
function normalized(data: CustomerAddressData): CustomerAddressData {
  const countryCode = data.countryCode.toUpperCase()
  return { ...data, countryCode, ...requireRegion({ ...data, countryCode }) }
}
