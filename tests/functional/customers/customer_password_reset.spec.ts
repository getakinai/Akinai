import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import CustomerAccount from '#models/customer_account'
import Customer from '#models/customer'
import CustomerVerificationCode from '#models/customer_verification_code'
import CustomerPasswordChangedNotification from '#mails/customer_password_changed_notification'
import CustomerPasswordResetCodeNotification from '#mails/customer_password_reset_code_notification'
import { CUSTOMER_PASSWORD, createCustomerAccount } from '#tests/helpers/customers'

const NEW_PASSWORD = 'a brand new passphrase'
const SESSION_KEY = 'reset_verification_id'

type Body = Record<string, unknown>

function post(client: any, url: string, body: Body = {}, session: Body = {}) {
  return client.post(url).json(body).withSession(session).accept('json').withCsrfToken()
}

function resetCode(mails: ReturnType<typeof mail.fake>['mails'], email: string): string {
  const [message] = mails.queued(
    (queued) => queued instanceof CustomerPasswordResetCodeNotification && queued.to === email
  ) as CustomerPasswordResetCodeNotification[]
  if (!message) throw new Error(`No reset code queued for ${email}`)
  return message.code
}

test.group('Customer password reset', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return () => {
      mail.restore()
      return cleanup()
    }
  })

  async function startReset(client: any, email: string) {
    const { mails } = mail.fake()
    const response = await post(client, '/forgot-password', { email })
    response.assertStatus(202)
    return { mails, response, session: { [SESSION_KEY]: response.session(SESSION_KEY) } }
  }

  test('emails a code when the email has an account', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()

    const { mails, response } = await startReset(client, account.email)

    response.assertBody({ data: { redirectTo: '/reset-password' } })
    assert.exists(response.session(SESSION_KEY))
    mails.assertQueued(
      CustomerPasswordResetCodeNotification,
      (message) => message.to === account.email
    )
  })

  test('answers the same for an unknown email and sends nothing', async ({ client, assert }) => {
    const { mails, response } = await startReset(client, 'nobody-here@example.com')

    response.assertBody({ data: { redirectTo: '/reset-password' } })
    assert.exists(response.session(SESSION_KEY))
    mails.assertNoneQueued()
  })

  test('a guest profile without a login gets no code', async ({ client }) => {
    const guest = await Customer.create({
      email: `guest-${Date.now()}@example.com`,
      fullName: null,
      phone: null,
      isActive: true,
    })

    const { mails } = await startReset(client, guest.email)

    mails.assertNoneQueued()
  })

  test('the right code sets the new password and signs in', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { mails, session } = await startReset(client, account.email)

    const response = await post(
      client,
      '/reset-password',
      {
        code: resetCode(mails, account.email),
        password: NEW_PASSWORD,
        passwordConfirmation: NEW_PASSWORD,
      },
      session
    )

    response.assertStatus(200)
    response.assertBody({ data: { redirectTo: '/account' } })
    assert.isUndefined(response.session(SESSION_KEY))
    assert.equal(response.session('customer_session_version'), 1)

    await account.refresh()
    assert.isTrue(await account.verifyPassword(NEW_PASSWORD))
    assert.isFalse(await account.verifyPassword(CUSTOMER_PASSWORD))
    mails.assertQueued(
      CustomerPasswordChangedNotification,
      (message) => message.to === account.email
    )
  })

  test('signs out sessions started before the reset', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { mails, session } = await startReset(client, account.email)
    await post(
      client,
      '/reset-password',
      {
        code: resetCode(mails, account.email),
        password: NEW_PASSWORD,
        passwordConfirmation: NEW_PASSWORD,
      },
      session
    )
    const updated = await CustomerAccount.findOrFail(account.id)
    assert.equal(updated.sessionVersion, 1)

    const stale = await client
      .get('/account/me')
      .accept('json')
      .withGuard('customer')
      .loginAs(updated)
      .withSession({ customer_session_version: 0 })
    stale.assertStatus(401)

    const current = await client
      .get('/account/me')
      .accept('json')
      .withGuard('customer')
      .loginAs(updated)
      .withSession({ customer_session_version: 1 })
    current.assertStatus(200)
  })

  test('a wrong code leaves the password unchanged', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { mails, session } = await startReset(client, account.email)
    const code = resetCode(mails, account.email)

    const response = await post(
      client,
      '/reset-password',
      {
        code: code === '000000' ? '111111' : '000000',
        password: NEW_PASSWORD,
        passwordConfirmation: NEW_PASSWORD,
      },
      session
    )

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code' }] })
    await account.refresh()
    assert.isTrue(await account.verifyPassword(CUSTOMER_PASSWORD))
  })

  test('the decoy code for an unknown email can never reset anything', async ({ client }) => {
    const { session } = await startReset(client, 'nobody-here@example.com')

    const response = await post(
      client,
      '/reset-password',
      { code: '123456', password: NEW_PASSWORD, passwordConfirmation: NEW_PASSWORD },
      session
    )

    response.assertStatus(422)
  })

  test('validates the new password', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const { session } = await startReset(client, account.email)

    const response = await post(
      client,
      '/reset-password',
      { code: '123456', password: 'short', passwordConfirmation: 'nope' },
      session
    )

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'password', rule: 'minLength' },
        { field: 'passwordConfirmation', rule: 'sameAs' },
      ],
    })
  })

  test('limits requests for the same email', async ({ client }) => {
    mail.fake()
    const email = `limit-${Date.now()}@example.com`
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await post(client, '/forgot-password', { email })
      response.assertStatus(202)
    }

    const blocked = await post(client, '/forgot-password', { email })
    blocked.assertStatus(429)
  })

  test('the reset page needs a pending request', async ({ client }) => {
    const response = await client.get('/reset-password').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/forgot-password')
  })

  test('the code row is bound to the reset purpose', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { session } = await startReset(client, account.email)

    const row = await CustomerVerificationCode.findOrFail(session[SESSION_KEY])
    assert.equal(row.purpose, 'password_reset')

    const crossFlow = await post(
      client,
      '/signup/verify',
      { code: '123456' },
      { signup_verification_id: row.id }
    )
    crossFlow.assertStatus(422)
  })
})
