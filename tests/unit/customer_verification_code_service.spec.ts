import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import CustomerVerificationCode from '#models/customer_verification_code'
import CustomerVerificationCodeService from '#services/customer_verification_code_service'
import VerificationCodeException from '#exceptions/verification_code_exception'
import { VERIFICATION_MAX_ATTEMPTS } from '#constants/customer_verification'

const EMAIL = 'otp@example.com'

function wrongCode(code: string) {
  return code === '000000' ? '111111' : '000000'
}

async function expectCodeError(promise: Promise<unknown>, message: string, assert: any) {
  try {
    await promise
    assert.fail('Expected a VerificationCodeException')
  } catch (error) {
    assert.instanceOf(error, VerificationCodeException)
    assert.equal((error as VerificationCodeException).message, message)
  }
}

test.group('CustomerVerificationCodeService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('generates 6-digit codes', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    for (let index = 0; index < 50; index++) {
      assert.match(service.generateCode(), /^\d{6}$/)
    }
  })

  test('hashes are bound to the email and purpose', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const hash = service.hashCode(EMAIL, 'signup', '123456')

    assert.lengthOf(hash, 64)
    assert.notInclude(hash, '123456')
    assert.equal(service.hashCode(EMAIL, 'signup', '123456'), hash)
    assert.notEqual(service.hashCode('other@example.com', 'signup', '123456'), hash)
    assert.notEqual(service.hashCode(EMAIL, 'password_reset', '123456'), hash)
  })

  test('issuing a code replaces the previous unused one', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const first = await service.issue(EMAIL, 'signup')
    const second = await service.issue(EMAIL, 'signup')

    assert.isNull(await CustomerVerificationCode.find(first.record.id))
    assert.exists(await CustomerVerificationCode.find(second.record.id))
  })

  test('consume accepts the right code once', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const { record, code } = await service.issue(EMAIL, 'signup')

    const consumed = await service.consume(record.id, 'signup', code)
    assert.equal(consumed.id, record.id)

    await expectCodeError(
      service.consume(record.id, 'signup', code),
      'This code has expired. Request a new one.',
      assert
    )
  })

  test('consume counts wrong guesses and then locks', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const { record, code } = await service.issue(EMAIL, 'signup')

    for (let attempt = 1; attempt < VERIFICATION_MAX_ATTEMPTS; attempt++) {
      await expectCodeError(
        service.consume(record.id, 'signup', wrongCode(code)),
        'That code is incorrect',
        assert
      )
    }
    await expectCodeError(
      service.consume(record.id, 'signup', wrongCode(code)),
      'Too many wrong attempts. Request a new code.',
      assert
    )
    await expectCodeError(
      service.consume(record.id, 'signup', code),
      'Too many wrong attempts. Request a new code.',
      assert
    )

    await record.refresh()
    assert.equal(record.attempts, VERIFICATION_MAX_ATTEMPTS)
    assert.isNull(record.consumedAt)
  })

  test('consume rejects expired codes and codes for another purpose', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const { record, code } = await service.issue(EMAIL, 'signup')

    await expectCodeError(
      service.consume(record.id, 'password_reset', code),
      'This code has expired. Request a new one.',
      assert
    )

    await record.merge({ expiresAt: DateTime.now().minus({ seconds: 1 }) }).save()
    await expectCodeError(
      service.consume(record.id, 'signup', code),
      'This code has expired. Request a new one.',
      assert
    )
  })

  test('consume needs a verification id', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)

    await expectCodeError(
      service.consume(undefined, 'signup', '123456'),
      'Your verification session has ended. Please start again.',
      assert
    )
  })

  test('resend enforces the cooldown, then issues a fresh code', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const { record } = await service.issue(EMAIL, 'signup')

    try {
      await service.resend(record.id, 'signup')
      assert.fail('Expected the cooldown to apply')
    } catch (error) {
      assert.instanceOf(error, VerificationCodeException)
      assert.equal((error as VerificationCodeException).status, 429)
    }

    await record.merge({ lastSentAt: DateTime.now().minus({ minutes: 2 }), attempts: 3 }).save()
    const resent = await service.resend(record.id, 'signup')

    assert.equal(resent.record.id, record.id)
    assert.equal(resent.record.attempts, 0)
    assert.equal(resent.record.codeHash, service.hashCode(EMAIL, 'signup', resent.code))
  })

  test('deleteExpired removes old expired and used codes only', async ({ assert }) => {
    const service = await app.container.make(CustomerVerificationCodeService)
    const fresh = await service.issue(EMAIL, 'signup')
    const old = await service.issue('old@example.com', 'signup')
    await old.record.merge({ expiresAt: DateTime.now().minus({ days: 2 }) }).save()

    const deleted = await service.deleteExpired()

    assert.equal(deleted, 1)
    assert.exists(await CustomerVerificationCode.find(fresh.record.id))
    assert.isNull(await CustomerVerificationCode.find(old.record.id))
  })
})
