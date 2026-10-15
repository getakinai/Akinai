import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import { MAX_CUSTOMER_SEGMENTS } from '#constants/customer_marketing'
import Customer from '#models/customer'
import CustomerSegment from '#models/customer_segment'
import CustomerTag from '#models/customer_tag'
import CustomerRepository, { marketingConsent } from '#repositories/customer_repository'
import CustomerSegmentService from '#services/customer_segment_service'
import CustomerSocialAuthService from '#services/customer_social_auth_service'
import { createCustomerAccount } from '#tests/helpers/customers'
import { socialProfile } from '#tests/helpers/ally'

let sequence = 0

function uniqueEmail() {
  sequence++
  return `unit-marketing-${sequence}-${Date.now()}@example.com`
}

test.group('marketingConsent', () => {
  test('records the choice, the source and the time', ({ assert }) => {
    const consent = marketingConsent(true, 'checkout')

    assert.isTrue(consent.acceptsMarketing)
    assert.equal(consent.marketingConsentSource, 'checkout')
    assert.isTrue(consent.marketingConsentAt.diffNow().as('seconds') > -5)
  })
})

test.group('CustomerRepository: marketing', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('setMarketing keeps the original consent when nothing changes', async ({ assert }) => {
    const repository = await app.container.make(CustomerRepository)
    const { customer } = await createCustomerAccount()
    const consentedAt = DateTime.now().minus({ days: 30 }).startOf('second')
    await customer
      .merge({
        acceptsMarketing: true,
        marketingConsentAt: consentedAt,
        marketingConsentSource: 'signup',
      })
      .save()

    await repository.setMarketing(customer, true, 'checkout')
    await customer.refresh()

    assert.equal(customer.marketingConsentSource, 'signup')
    assert.equal(customer.marketingConsentAt?.toMillis(), consentedAt.toMillis())
  })

  test('setMarketing records when and where consent was withdrawn', async ({ assert }) => {
    const repository = await app.container.make(CustomerRepository)
    const { customer } = await createCustomerAccount()
    await customer.merge(marketingConsent(true, 'signup')).save()

    await repository.setMarketing(customer, false, 'account')
    await customer.refresh()

    assert.isFalse(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'account')
  })

  test('setTagsAndNote adds and removes only what changed', async ({ assert }) => {
    const repository = await app.container.make(CustomerRepository)
    const { customer } = await createCustomerAccount()
    await CustomerTag.createMany([
      { customerId: customer.id, name: 'keep' },
      { customerId: customer.id, name: 'drop' },
    ])
    const kept = await CustomerTag.query()
      .where('customer_id', customer.id)
      .where('name', 'keep')
      .firstOrFail()

    await repository.setTagsAndNote(customer, ['keep', 'add'], 'A note')

    assert.sameMembers(await repository.tagNames(customer.id), ['add', 'keep'])
    const stillKept = await CustomerTag.query()
      .where('customer_id', customer.id)
      .where('name', 'keep')
      .firstOrFail()
    assert.equal(stillKept.id, kept.id)
    await customer.refresh()
    assert.equal(customer.note, 'A note')
  })

  test('setTagsAndNote does not touch other customers’ tags', async ({ assert }) => {
    const repository = await app.container.make(CustomerRepository)
    const { customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    await CustomerTag.create({ customerId: other.id, name: 'vip' })

    await repository.setTagsAndNote(customer, [], null)

    assert.deepEqual(await repository.tagNames(other.id), ['vip'])
  })
})

test.group('CustomerSegmentService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('saves only the filters in use', async ({ assert }) => {
    const service = await app.container.make(CustomerSegmentService)

    const segment = await service.create({
      name: `Compact ${Date.now()}`,
      filters: { tags: [], marketing: 'subscribed', ordersMin: 0, countryCode: undefined },
    })

    assert.deepEqual(segment.filters, { marketing: 'subscribed', ordersMin: 0 })
  })

  test('caps the number of saved segments', async ({ assert }) => {
    const service = await app.container.make(CustomerSegmentService)
    const existing = await CustomerSegment.query().count('* as total')
    const missing = MAX_CUSTOMER_SEGMENTS - Number(existing[0].$extras.total)
    await CustomerSegment.createMany(
      Array.from({ length: missing }, (_, index) => ({
        name: `Cap ${index} ${Date.now()}`,
        filters: {},
      }))
    )

    await assert.rejects(
      () => service.create({ name: `One too many ${Date.now()}`, filters: {} }),
      errors.E_VALIDATION_ERROR
    )
  })
})

test.group('CustomerSocialAuthService: marketing', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('a new social signup is subscribed by default', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)

    const account = await service.resolve('google', socialProfile(), { allowSignup: true })
    const customer = await Customer.findOrFail(account.customerId)

    assert.isTrue(customer.acceptsMarketing)
    assert.equal(customer.marketingConsentSource, 'signup')
  })

  test('claiming an existing guest profile keeps its choice', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const email = uniqueEmail()
    await Customer.create({ email, fullName: null, phone: null, isActive: true })

    const account = await service.resolve('google', socialProfile({ email }), {
      allowSignup: true,
    })
    const customer = await Customer.findOrFail(account.customerId)

    assert.isFalse(customer.acceptsMarketing)
  })
})
