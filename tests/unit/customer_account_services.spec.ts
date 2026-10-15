import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import CustomerOwnershipRepository from '#repositories/customer_ownership_repository'
import CheckoutService, { THANK_YOU_TTL_MINUTES } from '#services/checkout_service'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import {
  CUSTOMER_PASSWORD,
  createCustomerAccount,
  createCustomerAddress,
  createPlacedOrder,
} from '#tests/helpers/customers'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

test.group('CustomerOwnershipRepository', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('owns is true only for the customer’s own address', async ({ assert }) => {
    const repository = await app.container.make(CustomerOwnershipRepository)
    const { customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const address = await createCustomerAddress(customer)

    assert.isTrue(await repository.owns('address', customer.id, address.id))
    assert.isFalse(await repository.owns('address', other.id, address.id))
    assert.isFalse(await repository.owns('address', customer.id, UNKNOWN_ID))
  })

  test('owns excludes staff draft orders', async ({ assert }) => {
    const repository = await app.container.make(CustomerOwnershipRepository)
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const draft = await createPlacedOrder(customer, { status: 'draft' })

    assert.isTrue(await repository.owns('order', customer.id, order.id))
    assert.isFalse(await repository.owns('order', customer.id, draft.id))
  })
})

test.group('CustomerService.updateOwnProfile', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('saves name and phone without a password', async ({ assert }) => {
    const service = await app.container.make(CustomerService)
    const { account, customer } = await createCustomerAccount()

    const { customer: updated } = await service.updateOwnProfile(account, {
      fullName: 'Ana Cruz',
      email: customer.email.toUpperCase(),
      phone: '+6421000000',
    })

    assert.equal(updated.fullName, 'Ana Cruz')
    assert.equal(updated.phone, '+6421000000')
    assert.equal(updated.email, customer.email)
  })

  test('rejects an email change without the right password', async ({ assert }) => {
    const service = await app.container.make(CustomerService)
    const { account, customer } = await createCustomerAccount()
    const data = { fullName: customer.fullName, email: 'changed@example.com', phone: null }

    await assert.rejects(() => service.updateOwnProfile(account, data), errors.E_VALIDATION_ERROR)
    await assert.rejects(
      () => service.updateOwnProfile(account, data, 'wrong-password'),
      errors.E_VALIDATION_ERROR
    )
  })

  test('changes the email with the current password', async ({ assert }) => {
    const service = await app.container.make(CustomerService)
    const { account, customer } = await createCustomerAccount()

    const { customer: updated } = await service.updateOwnProfile(
      account,
      { fullName: customer.fullName, email: 'Changed@Example.com', phone: null },
      CUSTOMER_PASSWORD
    )

    assert.equal(updated.email, 'changed@example.com')
    await account.refresh()
    assert.equal(account.email, 'changed@example.com')
  })
})

test.group('CheckoutService.findThankYouOrder', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('is not expired within the time limit', async ({ assert }) => {
    const service = await app.container.make(CheckoutService)
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, {
      placedMinutesAgo: THANK_YOU_TTL_MINUTES - 1,
    })

    const result = await service.findThankYouOrder(order.id, [], customer)

    assert.equal(result?.order.id, order.id)
    assert.isFalse(result?.expired)
  })

  test('is expired after the time limit', async ({ assert }) => {
    const service = await app.container.make(CheckoutService)
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, {
      placedMinutesAgo: THANK_YOU_TTL_MINUTES + 1,
    })

    const result = await service.findThankYouOrder(order.id, [], customer)

    assert.isTrue(result?.expired)
  })

  test('lets a guest see an order placed in their session only', async ({ assert }) => {
    const service = await app.container.make(CheckoutService)
    const order = await createPlacedOrder(null)

    assert.isNotNull(await service.findThankYouOrder(order.id, [order.id], null))
    assert.isNull(await service.findThankYouOrder(order.id, [], null))
  })

  test('hides another customer’s order', async ({ assert }) => {
    const service = await app.container.make(CheckoutService)
    const { customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const order = await createPlacedOrder(other)

    assert.isNull(await service.findThankYouOrder(order.id, [], customer))
  })
})

test.group('OrderService customer orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('paginateForCustomer returns placed orders with item counts', async ({ assert }) => {
    const service = await app.container.make(OrderService)
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { quantity: 4 })
    await createPlacedOrder(customer, { status: 'draft' })

    const page = await service.paginateForCustomer(customer.id)

    assert.lengthOf(page.all(), 1)
    assert.equal(page.all()[0].id, order.id)
    assert.equal(Number(page.all()[0].$extras.itemCount), 4)
  })

  test('findForCustomerOrFail rejects other customers and drafts', async ({ assert }) => {
    const service = await app.container.make(OrderService)
    const { customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    const draft = await createPlacedOrder(customer, { status: 'draft' })

    const found = await service.findForCustomerOrFail(customer.id, order.id)
    assert.equal(found.id, order.id)
    assert.lengthOf(found.lineItems, 1)

    await assert.rejects(() => service.findForCustomerOrFail(other.id, order.id))
    await assert.rejects(() => service.findForCustomerOrFail(customer.id, draft.id))
  })
})
