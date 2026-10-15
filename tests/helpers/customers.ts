import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import type Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import Order, { type OrderPaymentMethod, type OrderStatus } from '#models/order'
import OrderLineItem from '#models/order_line_item'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'

export const CUSTOMER_PASSWORD = 'password123'

let sequence = 0

/**
 * A storefront customer with a login, for `.withGuard('customer').loginAs(account)`.
 * They have a country (NZ) by default so account routes don't redirect to
 * the welcome step; pass `countryCode: null` to test that step.
 */
export async function createCustomerAccount(
  overrides: {
    fullName?: string | null
    email?: string
    phone?: string | null
    countryCode?: string | null
  } = {}
): Promise<{ account: CustomerAccount; customer: Customer }> {
  const customerService = await app.container.make(CustomerService)
  const accountRepository = await app.container.make(CustomerAccountRepository)
  sequence++

  const account = await customerService.createVerifiedAccount({
    fullName: overrides.fullName === undefined ? `Shopper ${sequence}` : overrides.fullName,
    email: overrides.email ?? `shopper-${sequence}-${Date.now()}@example.com`,
    phone: overrides.phone ?? null,
    passwordHash: await hash.make(CUSTOMER_PASSWORD),
  })
  const customer = await accountRepository.loadCustomer(account)
  const countryCode = overrides.countryCode === undefined ? 'NZ' : overrides.countryCode
  if (countryCode) {
    await customer.merge({ countryCode, timezone: 'Pacific/Auckland' }).save()
  }
  return { account, customer }
}

export async function createCustomerAddress(
  customer: Customer,
  overrides: Partial<{ fullName: string; city: string; isDefault: boolean }> = {}
) {
  const addressService = await app.container.make(CustomerAddressService)
  return addressService.create(customer, {
    fullName: overrides.fullName ?? 'Jane Buyer',
    company: null,
    address1: '1 George Street',
    address2: null,
    city: overrides.city ?? 'Sydney',
    province: 'NSW',
    postalCode: '2000',
    countryCode: 'AU',
    phone: null,
    isDefault: overrides.isDefault ?? false,
  })
}

/**
 * An order for the customer as checkout would leave it, with one line of
 * `quantity` items. `placedMinutesAgo` back-dates `completed_at`.
 */
export async function createPlacedOrder(
  customer: Customer | null,
  {
    status = 'open',
    placedMinutesAgo = 0,
    paymentMethod = 'bank_transfer',
    quantity = 2,
  }: {
    status?: OrderStatus
    placedMinutesAgo?: number
    paymentMethod?: OrderPaymentMethod
    quantity?: number
  } = {}
): Promise<Order> {
  sequence++
  const number = 800_000 + sequence
  const placedAt = DateTime.now().minus({ minutes: placedMinutesAgo })

  const order = await Order.create({
    draftNumber: number,
    orderNumber: status === 'draft' ? null : number,
    status,
    paymentStatus: status === 'draft' ? null : 'pending',
    paymentMethod: status === 'draft' ? null : paymentMethod,
    customerId: customer?.id ?? null,
    email: customer?.email ?? 'guest@example.com',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    taxAppliesToShipping: false,
    shippingTitle: 'Standard',
    subtotal: 20 * quantity,
    discountTotal: 0,
    shippingTotal: 10,
    taxTotal: 0,
    total: 20 * quantity + 10,
    completedAt: status === 'draft' ? null : placedAt,
  })
  await OrderLineItem.create({
    orderId: order.id,
    productTitle: 'Mug',
    variantTitle: null,
    unitPrice: 20,
    quantity,
    lineTotal: 20 * quantity,
    position: 0,
  })
  return order
}
