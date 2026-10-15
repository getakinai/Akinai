import vine from '@vinejs/vine'
import { isPwnedCheckEnabled, pwnedPasswordCount } from '#utils/pwned_password'

/**
 * Rejects passwords found in known data breaches. Skipped when
 * `PWNED_PASSWORDS_ENABLED` is off (tests).
 */
export const notPwnedPassword = vine.createRule(
  async (value, _options, field) => {
    if (typeof value !== 'string' || !field.isValid || !isPwnedCheckEnabled()) return
    if ((await pwnedPasswordCount(value)) > 0) {
      field.report(
        'This password has appeared in a data breach. Please choose a different one.',
        'notPwnedPassword',
        field
      )
    }
  },
  { name: 'notPwnedPassword', isAsync: true }
)
