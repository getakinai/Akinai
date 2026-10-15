import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

/** reCAPTCHA v3 score floor — below this is treated as a bot. */
export const RECAPTCHA_MIN_SCORE = 0.5

/** Actions sent by `grecaptcha.execute()` on each protected form. */
export const RECAPTCHA_ACTIONS = [
  'admin_login',
  'admin_login_mfa',
  'admin_setup',
  'customer_login',
  'customer_signup',
  'customer_signup_verify',
  'customer_signup_resend',
  'customer_forgot_password',
  'customer_password_reset',
  'customer_password_reset_resend',
  'customer_newsletter',
  'maintenance_newsletter',
  'checkout',
  'support_ticket_create',
  'support_ticket_reply',
] as const

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[number]

const VERIFICATION_URL = 'https://www.google.com/recaptcha/api/siteverify'
const VERIFICATION_TIMEOUT_MS = 5000

type VerifyOptions = {
  /** The Google `action` must match, so a token can't be replayed on another form. */
  action?: RecaptchaAction
  remoteIp?: string
  minScore?: number
}

type SiteVerifyResponse = {
  'success'?: boolean
  'score'?: number
  'action'?: string
  'error-codes'?: string[]
}

export function isRecaptchaEnabled(): boolean {
  return env.get('RECAPTCHA_ENABLED', false)
}

/**
 * Verify a reCAPTCHA v3 token with Google (score-aware).
 * Fails closed when the secret is missing, Google is unreachable or the score is too low.
 */
export async function verifyRecaptchaV3(
  token: string,
  {
    action,
    remoteIp,
    minScore = env.get('RECAPTCHA_MIN_SCORE', RECAPTCHA_MIN_SCORE),
  }: VerifyOptions = {}
): Promise<boolean> {
  const secret = env.get('RECAPTCHA_SECRET_KEY')?.release()
  if (!secret) {
    logger.error('RECAPTCHA_SECRET_KEY is not configured')
    return false
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)

    const response = await fetch(VERIFICATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(VERIFICATION_TIMEOUT_MS),
    })
    if (!response.ok) {
      logger.warn({ status: response.status }, 'reCAPTCHA verification request failed')
      return false
    }

    const result = (await response.json()) as SiteVerifyResponse

    if (!result.success) {
      logger.warn({ errorCodes: result['error-codes'] }, 'reCAPTCHA token rejected')
      return false
    }

    if (typeof result.score !== 'number' || result.score < minScore) {
      logger.warn({ score: result.score, action }, 'reCAPTCHA score too low or missing')
      return false
    }

    if (action && result.action !== action) {
      logger.warn({ action: result.action, expectedAction: action }, 'reCAPTCHA action mismatch')
      return false
    }

    return true
  } catch (error) {
    logger.error({ err: error }, 'reCAPTCHA verification error')
    return false
  }
}
