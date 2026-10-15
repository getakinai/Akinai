import vine from '@vinejs/vine'
import { isValid } from 'mailchecker'

/**
 * Rejects throwaway inboxes (mailinator, yopmail, ...), using the domain
 * list bundled with `mailchecker`.
 */
export const notDisposableEmail = vine.createRule(
  (value, _options, field) => {
    if (typeof value !== 'string' || !field.isValid) return
    if (!isValid(value)) {
      field.report('Please use a permanent email address', 'notDisposableEmail', field)
    }
  },
  { name: 'notDisposableEmail' }
)
