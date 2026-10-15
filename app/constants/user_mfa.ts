/** Encryption purpose for stored TOTP secrets. */
export const MFA_ENCRYPTION_PURPOSE = 'user-mfa'

/** Session key holding the staff sign-in waiting for its MFA code. */
export const MFA_PENDING_LOGIN_SESSION_KEY = 'admin_mfa_pending_login'

/** Session key holding the encrypted secret while MFA setup is unconfirmed. */
export const MFA_PENDING_SETUP_SESSION_KEY = 'admin_mfa_pending_setup'

/** How long a password-verified sign-in may wait for its MFA code. */
export const MFA_PENDING_LOGIN_TTL_SECONDS = 5 * 60

export const MFA_RECOVERY_CODE_COUNT = 10

/** Accept the previous and next 30-second step for clock drift. */
export const MFA_EPOCH_TOLERANCE_SECONDS = 30

/** Wrong MFA codes per staff User before that sign-in is blocked. */
export const MFA_MAX_ATTEMPTS = 5
export const MFA_BLOCK_DURATION = '20 mins'

/** Session key holding the staff User's `sessionVersion` at sign-in. */
export const USER_SESSION_VERSION_KEY = 'user_session_version'
