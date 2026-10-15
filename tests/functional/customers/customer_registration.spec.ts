import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import CustomerAccount from '#models/customer_account'
import CustomerVerificationCode from '#models/customer_verification_code'
import CustomerAccountExistsNotification from '#mails/customer_account_exists_notification'
import CustomerSignupCodeNotification from '#mails/customer_signup_code_notification'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

const PASSWORD = 'correct horse battery staple'
const SESSION_KEY = 'signup_verification_id'

type Body = Record<string, unknown>

function signupBody(overrides: Body = {}): Body {
  return {
    fullName: 'Jane Shopper',
    email: `jane-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    phone: null,
    password: PASSWORD,
    passwordConfirmation: PASSWORD,
    ...overrides,
  }
}

function post(client: any, url: string, body: Body = {}, session: Body = {}) {
  return client.post(url).json(body).withSession(session).accept('json').withCsrfToken()
}

function sentCode(mails: ReturnType<typeof mail.fake>['mails'], email: string): string {
  const [message] = mails.queued(
    (queued) => queued instanceof CustomerSignupCodeNotification && queued.to === email
  ) as CustomerSignupCodeNotification[]
  if (!message) throw new Error(`No signup code queued for ${email}`)
  return message.code
}

function wrongCode(code: string) {
  return code === '000000' ? '111111' : '000000'
}

test.group('Customer signup: start', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return () => {
      mail.restore()
      return cleanup()
    }
  })

  test('emails a code and creates no account yet', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const body = signupBody()

    const response = await post(client, '/signup', body)

    response.assertStatus(202)
    response.assertBody({ data: { redirectTo: '/signup/verify' } })
    assert.isNull(await CustomerAccount.findBy('email', body.email))
    assert.isNull(await Customer.findBy('email', body.email))

    const row = await CustomerVerificationCode.findByOrFail('email', body.email)
    assert.equal(response.session(SESSION_KEY), row.id)
    assert.equal(row.purpose, 'signup')
    assert.notInclude(row.codeHash, sentCode(mails, body.email as string))
    assert.notEqual(row.payload?.passwordHash, PASSWORD)
  })

  test('answers the same for an email that already has an account', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const { account } = await createCustomerAccount()

    const response = await post(client, '/signup', signupBody({ email: account.email }))

    response.assertStatus(202)
    response.assertBody({ data: { redirectTo: '/signup/verify' } })
    assert.exists(response.session(SESSION_KEY))
    mails.assertQueued(CustomerAccountExistsNotification, (message) => message.to === account.email)
    mails.assertNotQueued(CustomerSignupCodeNotification)
  })

  test('rejects throwaway email domains', async ({ client }) => {
    mail.fake()
    const response = await post(client, '/signup', signupBody({ email: 'temp@mailinator.com' }))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email', rule: 'notDisposableEmail' }] })
  })

  test('requires a 12 character password and a matching confirmation', async ({ client }) => {
    mail.fake()
    const response = await post(
      client,
      '/signup',
      signupBody({ password: 'short', passwordConfirmation: 'different' })
    )

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'password', rule: 'minLength' },
        { field: 'passwordConfirmation', rule: 'sameAs' },
      ],
    })
  })

  test('ignores an owner id sent by the browser', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const { customer: victim } = await createCustomerAccount()
    const body = signupBody({ customerId: victim.id })

    await post(client, '/signup', body)
    const response = await post(
      client,
      '/signup/verify',
      { code: sentCode(mails, body.email as string) },
      { [SESSION_KEY]: (await CustomerVerificationCode.findByOrFail('email', body.email)).id }
    )

    response.assertStatus(201)
    const account = await CustomerAccount.findByOrFail('email', body.email)
    assert.notEqual(account.customerId, victim.id)
  })

  test('is rate limited per IP', async ({ client }) => {
    mail.fake()
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await post(client, '/signup', signupBody())
      response.assertStatus(202)
    }

    const blocked = await post(client, '/signup', signupBody())
    blocked.assertStatus(429)
  })

  test('a signed-in customer is redirected away', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await client
      .post('/signup')
      .json(signupBody())
      .withCsrfToken()
      .withGuard('customer')
      .loginAs(account)
      .redirects(0)

    response.assertStatus(302)
  })
})

test.group('Customer signup: verify', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return () => {
      mail.restore()
      return cleanup()
    }
  })

  async function startSignup(client: any, body: Body = signupBody()) {
    const { mails } = mail.fake()
    const response = await post(client, '/signup', body)
    response.assertStatus(202)
    return {
      body,
      code: sentCode(mails, body.email as string),
      session: { [SESSION_KEY]: response.session(SESSION_KEY) },
    }
  }

  test('the right code creates the account and signs in', async ({ client, assert }) => {
    const { body, code, session } = await startSignup(client)

    const response = await post(client, '/signup/verify', { code }, session)

    response.assertStatus(201)
    response.assertBody({ data: { redirectTo: '/account' } })
    assert.isUndefined(response.session(SESSION_KEY))
    assert.equal(response.session('customer_session_version'), 0)

    const account = await CustomerAccount.findByOrFail('email', body.email)
    assert.isTrue(await account.verifyPassword(PASSWORD))
    const customer = await Customer.findOrFail(account.customerId)
    assert.equal(customer.fullName, 'Jane Shopper')
  })

  test('claims a guest profile and its orders only after the code', async ({ client, assert }) => {
    const guest = await Customer.create({
      email: `guest-${Date.now()}@example.com`,
      fullName: 'Original Guest',
      phone: null,
      isActive: true,
    })
    await createPlacedOrder(guest)

    const { code, session } = await startSignup(
      client,
      signupBody({ email: guest.email, fullName: 'Someone Else' })
    )
    assert.isNull(await CustomerAccount.findBy('email', guest.email))

    const response = await post(client, '/signup/verify', { code }, session)

    response.assertStatus(201)
    const account = await CustomerAccount.findByOrFail('email', guest.email)
    assert.equal(account.customerId, guest.id)
    await guest.refresh()
    assert.equal(guest.fullName, 'Original Guest')
  })

  test('a wrong code is rejected and nothing is created', async ({ client, assert }) => {
    const { body, code, session } = await startSignup(client)

    const response = await post(client, '/signup/verify', { code: wrongCode(code) }, session)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code', message: 'That code is incorrect' }] })
    assert.isNull(await CustomerAccount.findBy('email', body.email))
  })

  test('locks the code after 5 wrong guesses', async ({ client, assert }) => {
    const { body, code, session } = await startSignup(client)

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await post(client, '/signup/verify', { code: wrongCode(code) }, session)
      response.assertBodyContains({ errors: [{ message: 'That code is incorrect' }] })
    }
    const fifth = await post(client, '/signup/verify', { code: wrongCode(code) }, session)
    fifth.assertBodyContains({
      errors: [{ message: 'Too many wrong attempts. Request a new code.' }],
    })

    const correct = await post(client, '/signup/verify', { code }, session)
    correct.assertStatus(422)
    assert.isNull(await CustomerAccount.findBy('email', body.email))
  })

  test('an expired code is rejected', async ({ client, assert }) => {
    const { body, code, session } = await startSignup(client)
    await CustomerVerificationCode.query()
      .where('email', body.email as string)
      .update({ expires_at: DateTime.now().minus({ minutes: 1 }).toJSDate() })

    const response = await post(client, '/signup/verify', { code }, session)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code', rule: 'verification_code' }] })
    assert.isNull(await CustomerAccount.findBy('email', body.email))
  })

  test('a code works only once', async ({ client }) => {
    const { code, session } = await startSignup(client)
    await post(client, '/signup/verify', { code }, session)

    const replay = await post(client, '/signup/verify', { code }, session)

    replay.assertStatus(422)
  })

  test('the "already has an account" flow can never sign in', async ({ client, assert }) => {
    mail.fake()
    const { account } = await createCustomerAccount()
    const start = await post(client, '/signup', signupBody({ email: account.email }))
    const session = { [SESSION_KEY]: start.session(SESSION_KEY) }

    for (const code of ['000000', '123456', '999999']) {
      const response = await post(client, '/signup/verify', { code }, session)
      response.assertStatus(422)
    }
    const accounts = await CustomerAccount.query().where('email', account.email)
    assert.lengthOf(accounts, 1)
    assert.equal(accounts[0].id, account.id)
  })

  test('needs a pending signup in the session', async ({ client }) => {
    const response = await post(client, '/signup/verify', { code: '123456' })

    response.assertStatus(410)
  })

  test('the code must be 6 digits', async ({ client }) => {
    const { session } = await startSignup(client)

    const response = await post(client, '/signup/verify', { code: '12ab' }, session)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'code' }] })
  })

  test('the verify page needs a pending signup', async ({ client }) => {
    const response = await client.get('/signup/verify').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/signup')
  })

  test('the view endpoint shows the email the code went to', async ({ client }) => {
    const { body, session } = await startSignup(client)

    const response = await client.get('/signup/verify/view').withSession(session).accept('json')

    response.assertStatus(200)
    response.assertBody({ data: { email: body.email } })
  })
})

test.group('Customer signup: resend', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    const cleanup = await testUtils.db().withGlobalTransaction()
    return () => {
      mail.restore()
      return cleanup()
    }
  })

  test('waits 60 seconds between codes', async ({ client }) => {
    mail.fake()
    const start = await post(client, '/signup', signupBody())
    const session = { [SESSION_KEY]: start.session(SESSION_KEY) }

    const response = await post(client, '/signup/verify/resend', {}, session)

    response.assertStatus(429)
  })

  test('sends a new code that replaces the old one', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const body = signupBody()
    const start = await post(client, '/signup', body)
    const session = { [SESSION_KEY]: start.session(SESSION_KEY) }
    const oldCode = sentCode(mails, body.email as string)
    await CustomerVerificationCode.query()
      .where('email', body.email as string)
      .update({ last_sent_at: DateTime.now().minus({ minutes: 2 }).toJSDate() })

    const response = await post(client, '/signup/verify/resend', {}, session)

    response.assertStatus(202)
    response.assertBody({ data: { cooldownSeconds: 60 } })
    const codes = (
      mails.queued(
        (queued) => queued instanceof CustomerSignupCodeNotification
      ) as CustomerSignupCodeNotification[]
    ).map((message) => message.code)
    assert.lengthOf(codes, 2)
    const newCode = codes[1]

    if (newCode !== oldCode) {
      const stale = await post(client, '/signup/verify', { code: oldCode }, session)
      stale.assertStatus(422)
    }
    const fresh = await post(client, '/signup/verify', { code: newCode }, session)
    fresh.assertStatus(201)
  })
})
