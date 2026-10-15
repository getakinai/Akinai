import { test } from '@japa/runner'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import CustomerSocialIdentity from '#models/customer_social_identity'
import { createCustomerAccount } from '#tests/helpers/customers'
import { type FakeCallback, fakeAlly, socialProfile } from '#tests/helpers/ally'
import { SOCIAL_INTENT_SESSION_KEY } from '#constants/social_providers'

/** The OAuth callback, as if the sign-in started on the login or Create account page. */
function callback(client: any, provider: string, intent?: 'login' | 'signup') {
  const request = client.get(`/${provider}/oauth/callback`).redirects(0)
  return intent ? request.withSession({ [SOCIAL_INTENT_SESSION_KEY]: intent }) : request
}

test.group('Customer social sign-in: redirect', (group) => {
  group.each.setup(() => limiter.clear(['memory']))

  test('sends the browser to Google', async ({ client, assert }) => {
    const response = await client.get('/google/oauth/redirect/login').redirects(0)

    response.assertStatus(302)
    const location = new URL(response.header('location') ?? '')
    assert.equal(location.origin, 'https://accounts.google.com')
    assert.equal(
      location.searchParams.get('redirect_uri')?.endsWith('/google/oauth/callback'),
      true
    )
    assert.isNotEmpty(location.searchParams.get('state'))
  })

  test('sends the browser to Microsoft personal accounts', async ({ client, assert }) => {
    const response = await client.get('/microsoft/oauth/redirect/login').redirects(0)

    response.assertStatus(302)
    const location = new URL(response.header('location') ?? '')
    assert.equal(location.origin, 'https://login.microsoftonline.com')
    assert.equal(location.pathname, '/consumers/oauth2/v2.0/authorize')
    assert.include(location.searchParams.get('scope') ?? '', 'User.Read')
    assert.isNotEmpty(location.searchParams.get('state'))
  })

  test('remembers whether the sign-in started on the Create account page', async ({
    client,
    assert,
  }) => {
    const signup = await client.get('/google/oauth/redirect/signup').redirects(0)
    const login = await client.get('/google/oauth/redirect/login').redirects(0)
    const none = await client.get('/google/oauth/redirect').redirects(0)
    const bogus = await client.get('/google/oauth/redirect/admin').redirects(0)

    assert.equal(signup.session()[SOCIAL_INTENT_SESSION_KEY], 'signup')
    assert.equal(login.session()[SOCIAL_INTENT_SESSION_KEY], 'login')
    none.assertStatus(404)
    bogus.assertStatus(404)
  })

  test('the intent never leaks into the OAuth state', async ({ client, assert }) => {
    for (const intent of ['login', 'signup']) {
      const response = await client.get(`/google/oauth/redirect/${intent}`).redirects(0)

      const location = response.header('location') ?? ''
      const state = new URL(location).searchParams.get('state') ?? ''
      assert.match(state, /^[\w-]+$/)
      assert.notInclude(location, 'intent')
    }
  })

  test('returns 404 for an unknown provider', async ({ client }) => {
    const redirect = await client.get('/facebook/oauth/redirect/login').redirects(0)
    const back = await client.get('/facebook/oauth/callback').redirects(0)

    redirect.assertStatus(404)
    back.assertStatus(404)
  })

  test('a signed-in customer is redirected to their account', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await client
      .get('/google/oauth/redirect/login')
      .withGuard('customer')
      .loginAs(account)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/account')
  })
})

test.group('Customer social sign-in: callback', (group) => {
  let restore: (() => Promise<void>) | null = null

  async function fake(result: FakeCallback) {
    restore = await fakeAlly(result)
  }

  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return async () => {
      await restore?.()
      restore = null
      await cleanup()
    }
  })

  test('rejects a sign-in from /login when no account uses the email', async ({
    client,
    assert,
  }) => {
    const profile = socialProfile()
    await fake({ profile })

    const login = await callback(client, 'google', 'login')

    login.assertStatus(302)
    login.assertHeader('location', '/login')
    login.assertFlashMessage(
      'error',
      'No account uses that email yet. Create an account first, then sign in.'
    )
    assert.isUndefined(login.session().auth_customer)
    assert.isNull(await Customer.findBy('email', profile.email))
    assert.isNull(await CustomerAccount.findBy('email', profile.email))
  })

  test('a callback with no remembered intent is treated as a sign-in', async ({
    client,
    assert,
  }) => {
    const profile = socialProfile()
    await fake({ profile })

    const response = await callback(client, 'microsoft')

    response.assertHeader('location', '/login')
    assert.isNull(await CustomerAccount.findBy('email', profile.email))
  })

  test('errors during signup flash on the Create account page', async ({ client }) => {
    await fake({ error: 'access_denied' })

    const response = await callback(client, 'google', 'signup')

    response.assertHeader('location', '/signup')
    response.assertFlashMessage('error', 'Sign-in was cancelled or failed. Please try again.')
  })

  test('creates an account for a new Google user from the Create account page', async ({
    client,
    assert,
  }) => {
    const profile = socialProfile()
    await fake({ profile })

    const response = await callback(client, 'google', 'signup')

    response.assertStatus(302)
    response.assertHeader('location', '/account')
    const account = await CustomerAccount.findByOrFail('email', profile.email)
    assert.equal(response.session().auth_customer, account.id)
    await account.refresh()
    assert.isNotNull(account.lastLoginAt)

    const identity = await CustomerSocialIdentity.findByOrFail('customerAccountId', account.id)
    assert.equal(identity.provider, 'google')
  })

  test('signs an existing email/password customer in through Outlook', async ({
    client,
    assert,
  }) => {
    const { account } = await createCustomerAccount()
    await fake({ profile: socialProfile({ email: account.email }) })

    const response = await callback(client, 'microsoft')

    response.assertStatus(302)
    response.assertHeader('location', '/account')
    assert.equal(response.session().auth_customer, account.id)
    const accounts = await CustomerAccount.query().where('email', account.email)
    assert.lengthOf(accounts, 1)
  })

  test('cancelled consent flashes an error on the login page', async ({ client, assert }) => {
    await fake({ error: 'access_denied' })

    const response = await callback(client, 'google')

    response.assertStatus(302)
    response.assertHeader('location', '/login')
    response.assertFlashMessage('error', 'Sign-in was cancelled or failed. Please try again.')
    assert.isUndefined(response.session().auth_customer)
  })

  test('a state mismatch is rejected', async ({ client, assert }) => {
    await fake({ error: 'state_mismatch', profile: socialProfile() })

    const response = await callback(client, 'microsoft')

    response.assertHeader('location', '/login')
    response.assertFlashMessage('error', 'Sign-in was cancelled or failed. Please try again.')
    assert.isUndefined(response.session().auth_customer)
    const identities = await CustomerSocialIdentity.query()
    assert.lengthOf(identities, 0)
  })

  test('an unverified email is rejected', async ({ client, assert }) => {
    const profile = socialProfile({ emailVerificationState: 'unverified' })
    await fake({ profile })

    const response = await callback(client, 'google')

    response.assertHeader('location', '/login')
    response.assertFlashMessage(
      'error',
      'We could not confirm the email on that account. Try another sign-in option.'
    )
    assert.isNull(await CustomerAccount.findBy('email', profile.email))
  })

  test('a disabled customer cannot sign in', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    await Customer.query().where('id', customer.id).update({ is_active: false })
    await fake({ profile: socialProfile({ email: account.email }) })

    const response = await callback(client, 'google')

    response.assertHeader('location', '/login')
    response.assertFlashMessage('error', 'This account has been disabled')
    assert.isUndefined(response.session().auth_customer)
  })

  test('a provider failure flashes a generic error', async ({ client, assert }) => {
    await fake({})

    const response = await callback(client, 'google')

    response.assertHeader('location', '/login')
    response.assertFlashMessage('error', 'Sign-in was cancelled or failed. Please try again.')
    assert.isUndefined(response.session().auth_customer)
  })
})
