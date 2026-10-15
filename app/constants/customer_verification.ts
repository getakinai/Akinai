export const VERIFICATION_PURPOSES = ['signup', 'password_reset'] as const
export type VerificationPurpose = (typeof VERIFICATION_PURPOSES)[number]

export const VERIFICATION_CODE_LENGTH = 6
export const VERIFICATION_CODE_TTL_MINUTES = 10
export const VERIFICATION_MAX_ATTEMPTS = 5
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60

/**
 * Session keys that hold the id of the pending verification row. The email
 * and the code never go in the session.
 */
export const VERIFICATION_SESSION_KEYS: Record<VerificationPurpose, string> = {
  signup: 'signup_verification_id',
  password_reset: 'reset_verification_id',
}

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
