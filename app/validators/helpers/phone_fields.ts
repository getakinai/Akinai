import vine from '@vinejs/vine'
import { dialCode } from '#constants/dial_codes'

const E164 = /^\+[1-9]\d{6,14}$/

/**
 * Checks that an E.164 number starts with the dial code of the country in
 * the sibling field `countryField`.
 */
const matchesCountryDialCode = vine.createRule<{ countryField: string }>(
  (value, { countryField }, field) => {
    if (!field.isValid || typeof value !== 'string') return
    const country = field.parent[countryField]
    if (typeof country !== 'string') return
    const code = dialCode(country)
    if (code && !value.startsWith(code)) {
      field.report(`The phone number must start with ${code}`, 'dialCode', field)
    }
  }
)

/**
 * Phone number in E.164 format (`+64272852711`) that matches the dial code
 * of the country picked in `countryField`.
 */
export function phoneSchema(countryField: string) {
  return vine.string().trim().regex(E164).use(matchesCountryDialCode({ countryField }))
}
