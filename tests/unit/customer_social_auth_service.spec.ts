import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import CustomerSocialIdentity from '#models/customer_social_identity'
import CustomerSocialAuthService from '#services/customer_social_auth_service'
import SocialAuthException from '#exceptions/social_auth_exception'
import { CUSTOMER_PASSWORD, createCustomerAccount } from '#tests/helpers/customers'
import { socialProfile } from '#tests/helpers/ally'

const SIGNUP = { allowSignup: true }

test.group('CustomerSocialAuthService.resolve', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('a sign-in with no account for the email is rejected', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const profile = socialProfile()

    await assert.rejects(
      () => service.resolve('google', profile),
      'No account uses that email yet. Create an account first, then sign in.'
    )
    assert.isNull(await Customer.findBy('email', profile.email))
    assert.isNull(await CustomerAccount.findBy('email', profile.email))
    assert.lengthOf(await CustomerSocialIdentity.query(), 0)
  })

  test('a sign-in does not claim a profile that has no login yet', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const email = socialProfile().email
    await Customer.create({ email, fullName: null, phone: null, isActive: true })

    await assert.rejects(
      () => service.resolve('microsoft', socialProfile({ email })),
      SocialAuthException
    )
    assert.isNull(await CustomerAccount.findBy('email', email))
  })

  test('creates a customer, account and identity for a new email', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const profile = socialProfile({ email: 'New.Person@Example.com', name: '  Ana Cruz  ' })

    const account = await service.resolve('google', profile, SIGNUP)

    assert.equal(account.email, 'new.person@example.com')
    const customer = await Customer.findOrFail(account.customerId)
    assert.equal(customer.email, 'new.person@example.com')
    assert.equal(customer.fullName, 'Ana Cruz')
    assert.isTrue(customer.isActive)

    const identity = await CustomerSocialIdentity.findByOrFail('customerAccountId', account.id)
    assert.equal(identity.provider, 'google')
    assert.equal(identity.providerUserId, profile.id)
    assert.equal(identity.email, 'new.person@example.com')
  })

  test('gives a new social-only account a password nobody knows', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)

    const account = await service.resolve('microsoft', socialProfile(), SIGNUP)
    const stored = await CustomerAccount.findOrFail(account.id)

    assert.isTrue(hash.isValidHash(stored.password))
    assert.isFalse(await hash.verify(stored.password, CUSTOMER_PASSWORD))
  })

  test('signs an already linked identity into the same account', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const profile = socialProfile()

    const first = await service.resolve('google', profile, SIGNUP)
    const second = await service.resolve('google', { ...profile, email: 'renamed@example.com' })

    assert.equal(second.id, first.id)
    const identities = await CustomerSocialIdentity.query().where('customer_account_id', first.id)
    assert.lengthOf(identities, 1)
  })

  test('links to an existing email/password account with the same email', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const { account } = await createCustomerAccount()

    const resolved = await service.resolve(
      'microsoft',
      socialProfile({ email: account.email.toUpperCase() })
    )

    assert.equal(resolved.id, account.id)
    const identity = await CustomerSocialIdentity.findByOrFail('customerAccountId', account.id)
    assert.equal(identity.provider, 'microsoft')

    const stored = await CustomerAccount.findOrFail(account.id)
    assert.isTrue(await hash.verify(stored.password, CUSTOMER_PASSWORD))
  })

  test('the same email on both providers ends up on one account', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const email = socialProfile().email

    const viaGoogle = await service.resolve('google', socialProfile({ email }), SIGNUP)
    const viaMicrosoft = await service.resolve('microsoft', socialProfile({ email }))

    assert.equal(viaMicrosoft.id, viaGoogle.id)
    const identities = await CustomerSocialIdentity.query().where(
      'customer_account_id',
      viaGoogle.id
    )
    assert.sameMembers(
      identities.map(({ provider }) => provider),
      ['google', 'microsoft']
    )
  })

  test('claims a profile that has no login yet', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)
    const email = socialProfile().email
    const guest = await Customer.create({
      email,
      fullName: null,
      phone: '+6421000000',
      isActive: true,
    })

    const account = await service.resolve(
      'google',
      socialProfile({ email, name: 'Guest Buyer' }),
      SIGNUP
    )

    assert.equal(account.customerId, guest.id)
    await guest.refresh()
    assert.equal(guest.fullName, 'Guest Buyer')
    assert.equal(guest.phone, '+6421000000')
    const customers = await Customer.query().where('email', email)
    assert.lengthOf(customers, 1)
  })

  test('rejects an unverified or missing email', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)

    await assert.rejects(
      () => service.resolve('google', socialProfile({ emailVerificationState: 'unverified' })),
      SocialAuthException
    )
    await assert.rejects(
      () => service.resolve('microsoft', socialProfile({ emailVerificationState: 'unsupported' })),
      SocialAuthException
    )
    await assert.rejects(
      () => service.resolve('google', { ...socialProfile(), email: null }),
      SocialAuthException
    )
    const identities = await CustomerSocialIdentity.query()
    assert.lengthOf(identities, 0)
  })

  test('rejects a disabled customer on every path', async ({ assert }) => {
    const service = await app.container.make(CustomerSocialAuthService)

    const { account, customer } = await createCustomerAccount()
    await customer.merge({ isActive: false }).save()
    await assert.rejects(
      () => service.resolve('google', socialProfile({ email: account.email })),
      'This account has been disabled'
    )

    const linkedProfile = socialProfile()
    const linked = await service.resolve('google', linkedProfile, SIGNUP)
    await Customer.query().where('id', linked.customerId).update({ is_active: false })
    await assert.rejects(
      () => service.resolve('google', linkedProfile),
      'This account has been disabled'
    )

    const archivedEmail = socialProfile().email
    await Customer.create({ email: archivedEmail, fullName: null, phone: null, isActive: false })
    await assert.rejects(
      () => service.resolve('microsoft', socialProfile({ email: archivedEmail }), SIGNUP),
      'This account has been disabled'
    )
    assert.isNull(await CustomerAccount.findBy('email', archivedEmail))
  })
})
