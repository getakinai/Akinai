import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { inject } from '@adonisjs/core'
import encryption from '@adonisjs/core/services/encryption'
import hash from '@adonisjs/core/services/hash'
import limiter from '@adonisjs/limiter/services/main'
import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'
import env from '#start/env'
import type User from '#models/user'
import UserMfaRepository from '#repositories/user_mfa_repository'
import AuditLogService from '#services/audit_log_service'
import MfaException from '#exceptions/mfa_exception'
import {
  MFA_BLOCK_DURATION,
  MFA_ENCRYPTION_PURPOSE,
  MFA_EPOCH_TOLERANCE_SECONDS,
  MFA_MAX_ATTEMPTS,
  MFA_RECOVERY_CODE_COUNT,
} from '#constants/user_mfa'
import { tooManyAttemptsMessage } from '#utils/too_many_attempts_message'

export type MfaSetup = {
  /** Encrypted secret to keep in the session until the code is confirmed. */
  encryptedSecret: string
  secret: string
  otpauthUri: string
  qrCodeDataUrl: string
}

export type MfaStatus = {
  enabled: boolean
  enabledAt: string | null
  recoveryCodesRemaining: number
}

const RECOVERY_CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

/**
 * Time-based one-time passwords (authenticator apps) for staff sign-in.
 * Secrets are stored encrypted, recovery codes as keyed hashes, and every
 * accepted time step is recorded so a code can't be replayed.
 */
@inject()
export default class UserMfaService {
  constructor(
    protected userMfaRepository: UserMfaRepository,
    protected auditLogService: AuditLogService
  ) {}

  status(user: User): MfaStatus {
    return {
      enabled: user.mfaEnabled,
      enabledAt: user.mfaEnabledAt?.toISO() ?? null,
      recoveryCodesRemaining: user.mfaRecoveryCodes?.length ?? 0,
    }
  }

  async beginSetup(user: User): Promise<MfaSetup> {
    if (user.mfaEnabled) throw MfaException.alreadyEnabled()

    const secret = generateSecret()
    const otpauthUri = generateURI({
      issuer: env.get('APP_NAME') || 'Storefront',
      label: user.email,
      secret,
    })
    return {
      encryptedSecret: this.encrypt(secret),
      secret,
      otpauthUri,
      qrCodeDataUrl: await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 }),
    }
  }

  /**
   * Turns MFA on once the User proves their app produces valid codes.
   * Returns the recovery codes, which are shown once and never again.
   */
  async confirmSetup(
    user: User,
    encryptedSecret: string | undefined,
    code: string,
    ipAddress: string | null
  ): Promise<string[]> {
    if (user.mfaEnabled) throw MfaException.alreadyEnabled()
    const secret = encryptedSecret ? this.decrypt(encryptedSecret) : null
    if (!secret) throw MfaException.setupExpired()

    const result = await this.verifyTotp(secret, code)
    if (!result) throw MfaException.invalidCode()

    const recoveryCodes = this.generateRecoveryCodes()
    await this.userMfaRepository.enable(
      user,
      encryptedSecret!,
      recoveryCodes.map((recoveryCode) => this.hashRecoveryCode(user.id, recoveryCode))
    )
    await this.userMfaRepository.claimTimeStep(user.id, result.timeStep)
    await this.auditLogService.recordSecurityEvent('mfa_enabled', user, { ipAddress })
    return recoveryCodes
  }

  /**
   * Checks the second step of a staff sign-in. Wrong codes count per User,
   * across IPs; after `MFA_MAX_ATTEMPTS` the User is blocked for a while.
   */
  async verifyLogin(user: User, code: string, ipAddress: string | null): Promise<void> {
    const [blocked] = await this.attemptLimiter().penalize(`mfa_login_${user.id}`, async () => {
      if (!(await this.verifyCode(user, code))) {
        await this.auditLogService.recordSecurityEvent('mfa_failed', user, { ipAddress })
        throw MfaException.invalidCode()
      }
    })
    if (blocked) {
      await this.auditLogService.recordSecurityEvent('login_blocked', user, {
        ipAddress,
        details: { step: 'mfa' },
      })
      throw MfaException.blocked(tooManyAttemptsMessage(blocked.response.availableIn))
    }
  }

  /**
   * Turns MFA off. Needs the password and a current code (or a recovery
   * code), so a hijacked session alone can't remove it.
   */
  async disable(
    user: User,
    password: string,
    code: string,
    ipAddress: string | null
  ): Promise<User> {
    if (!user.mfaEnabled) throw MfaException.notEnabled()
    if (!(await hash.verify(user.password, password))) throw MfaException.invalidPassword()
    await this.verifyLogin(user, code, ipAddress)

    const updated = await this.userMfaRepository.disable(user)
    await this.auditLogService.recordSecurityEvent('mfa_disabled', user, { ipAddress })
    return updated
  }

  /** A TOTP code, or else a recovery code (which is used up). */
  protected async verifyCode(user: User, code: string): Promise<boolean> {
    const secret = user.mfaSecret ? this.decrypt(user.mfaSecret) : null
    if (!secret) return false

    const normalized = code.replaceAll(/\s+/g, '')
    if (/^\d{6}$/.test(normalized)) {
      const result = await this.verifyTotp(secret, normalized, user.mfaLastTimeStep)
      return result ? this.userMfaRepository.claimTimeStep(user.id, result.timeStep) : false
    }

    const expected = Buffer.from(this.hashRecoveryCode(user.id, normalized), 'hex')
    return this.userMfaRepository.consumeRecoveryCode(user.id, (stored) => {
      const actual = Buffer.from(stored, 'hex')
      return actual.length === expected.length && timingSafeEqual(actual, expected)
    })
  }

  protected async verifyTotp(
    secret: string,
    token: string,
    afterTimeStep: number | null = null
  ): Promise<{ timeStep: number } | null> {
    try {
      const result = await verify({
        secret,
        token,
        epochTolerance: MFA_EPOCH_TOLERANCE_SECONDS,
        ...(afterTimeStep !== null ? { afterTimeStep } : {}),
      })
      return result.valid && 'timeStep' in result ? { timeStep: result.timeStep } : null
    } catch {
      return null
    }
  }

  generateRecoveryCodes(): string[] {
    return Array.from({ length: MFA_RECOVERY_CODE_COUNT }, () => {
      const bytes = randomBytes(10)
      const chars = Array.from(bytes, (byte) => RECOVERY_CODE_ALPHABET[byte % 31]).join('')
      return `${chars.slice(0, 5)}-${chars.slice(5)}`
    })
  }

  /**
   * HMAC keyed with APP_KEY and bound to the User, so a stored hash is
   * useless without the key and can't be used for another account.
   */
  hashRecoveryCode(userId: string, code: string): string {
    return createHmac('sha256', env.get('APP_KEY').release())
      .update(`mfa-recovery:${userId}:${code.trim().toLowerCase()}`)
      .digest('hex')
  }

  protected encrypt(secret: string): string {
    return String(encryption.encrypt(secret, { purpose: MFA_ENCRYPTION_PURPOSE }))
  }

  protected decrypt(value: string): string | null {
    return encryption.decrypt<string>(value, MFA_ENCRYPTION_PURPOSE)
  }

  protected attemptLimiter() {
    return limiter.use({
      requests: MFA_MAX_ATTEMPTS,
      duration: '15 mins',
      blockDuration: MFA_BLOCK_DURATION,
    })
  }
}
