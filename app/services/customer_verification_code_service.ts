import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import env from '#start/env'
import type CustomerVerificationCode from '#models/customer_verification_code'
import type { SignupVerificationPayload } from '#models/customer_verification_code'
import CustomerVerificationCodeRepository from '#repositories/customer_verification_code_repository'
import VerificationCodeException from '#exceptions/verification_code_exception'
import {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MINUTES,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
  type VerificationPurpose,
} from '#constants/customer_verification'

export type IssuedCode = { record: CustomerVerificationCode; code: string }

@inject()
export default class CustomerVerificationCodeService {
  constructor(protected repository: CustomerVerificationCodeRepository) {}

  generateCode(): string {
    return randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)
      .toString()
      .padStart(VERIFICATION_CODE_LENGTH, '0')
  }

  /**
   * HMAC keyed with APP_KEY and bound to the email and purpose, so a stored
   * hash is useless without the key and can't be replayed for another
   * email or flow.
   */
  hashCode(email: string, purpose: VerificationPurpose, code: string): string {
    return createHmac('sha256', env.get('APP_KEY').release())
      .update(`${purpose}:${email}:${code}`)
      .digest('hex')
  }

  async issue(
    email: string,
    purpose: VerificationPurpose,
    payload: SignupVerificationPayload | null = null
  ): Promise<IssuedCode> {
    const code = this.generateCode()
    const record = await this.repository.issue({
      email,
      purpose,
      payload,
      codeHash: this.hashCode(email, purpose, code),
      expiresAt: this.expiry(),
    })
    return { record, code }
  }

  /**
   * A fresh code for a pending verification, at most once every
   * `VERIFICATION_RESEND_COOLDOWN_SECONDS`.
   */
  async resend(id: string | undefined, purpose: VerificationPurpose): Promise<IssuedCode> {
    const record = await this.findActiveOrFail(id, purpose)
    const elapsed = DateTime.now().diff(record.lastSentAt, 'seconds').seconds
    if (elapsed < VERIFICATION_RESEND_COOLDOWN_SECONDS) {
      throw VerificationCodeException.tooSoon(
        Math.ceil(VERIFICATION_RESEND_COOLDOWN_SECONDS - elapsed)
      )
    }

    const code = this.generateCode()
    const refreshed = await this.repository.refresh(
      record,
      this.hashCode(record.email, purpose, code),
      this.expiry()
    )
    return { record: refreshed, code }
  }

  /**
   * Checks the code and marks it used. Wrong guesses count towards
   * `VERIFICATION_MAX_ATTEMPTS`; after that the code is burned.
   */
  async consume(
    id: string | undefined,
    purpose: VerificationPurpose,
    code: string
  ): Promise<CustomerVerificationCode> {
    const record = await this.findActiveOrFail(id, purpose)
    if (record.attempts >= VERIFICATION_MAX_ATTEMPTS) throw VerificationCodeException.locked()

    const expected = Buffer.from(record.codeHash, 'hex')
    const actual = Buffer.from(this.hashCode(record.email, purpose, code), 'hex')
    const matches = expected.length === actual.length && timingSafeEqual(expected, actual)

    if (!matches) {
      const attempts = await this.repository.incrementAttempts(record.id, VERIFICATION_MAX_ATTEMPTS)
      if (attempts === null || attempts >= VERIFICATION_MAX_ATTEMPTS) {
        throw VerificationCodeException.locked()
      }
      throw VerificationCodeException.invalid()
    }

    if (!(await this.repository.consume(record.id))) throw VerificationCodeException.expired()
    return record
  }

  /**
   * The pending verification behind `id`, without checking a code. Used to
   * show which email a code was sent to.
   */
  async findActive(
    id: string | undefined,
    purpose: VerificationPurpose
  ): Promise<CustomerVerificationCode | null> {
    if (!id) return null
    return this.repository.findActive(id, purpose)
  }

  async deleteExpired(): Promise<number> {
    return this.repository.deleteExpired()
  }

  private async findActiveOrFail(
    id: string | undefined,
    purpose: VerificationPurpose
  ): Promise<CustomerVerificationCode> {
    if (!id) throw VerificationCodeException.missing()
    const record = await this.repository.findActive(id, purpose)
    if (!record) throw VerificationCodeException.expired()
    return record
  }

  private expiry(): DateTime {
    return DateTime.now().plus({ minutes: VERIFICATION_CODE_TTL_MINUTES })
  }
}
