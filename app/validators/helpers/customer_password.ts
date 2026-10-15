import vine from '@vinejs/vine'
import { notPwnedPassword } from '#validators/rules/not_pwned_password'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '#constants/customer_verification'

/**
 * A new password for a customer or staff account: length limits only (no
 * character-mix rules, per NIST SP 800-63B), and not found in known breaches.
 */
export const newPasswordSchema = () =>
  vine
    .string()
    .minLength(PASSWORD_MIN_LENGTH)
    .maxLength(PASSWORD_MAX_LENGTH)
    .use(notPwnedPassword())

export const newCustomerPasswordSchema = newPasswordSchema

/** A password typed to sign in or confirm an action. Capped so hashing stays cheap. */
export const currentPasswordSchema = () => vine.string().maxLength(PASSWORD_MAX_LENGTH)
