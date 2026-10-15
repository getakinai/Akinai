import vine from '@vinejs/vine'
import {
  AU_ACCOUNT_NUMBER,
  AU_BSB,
  NZ_ACCOUNT_NUMBER,
  PAYMENT_REGIONS,
} from '#constants/payment_methods'

/**
 * Checks the account number against the format used by the chosen country.
 */
const accountNumberFormat = vine.createRule((value, _, field) => {
  if (typeof value !== 'string') return
  const country = field.parent?.countryCode
  if (country === 'NZ' && !NZ_ACCOUNT_NUMBER.test(value)) {
    field.report('Enter the account number as 00-0000-0000000-00', 'accountNumberFormat', field)
  }
  if (country === 'AU' && !AU_ACCOUNT_NUMBER.test(value)) {
    field.report('Enter a 6 to 10 digit account number', 'accountNumberFormat', field)
  }
})

export const adminPaymentBankTransferUpdateValidator = vine.create({
  isEnabled: vine.boolean({ strict: true }),
  countryCode: vine.enum(PAYMENT_REGIONS),
  accountName: vine.string().trim().minLength(1).maxLength(100),
  bankName: vine.string().trim().minLength(1).maxLength(100),
  accountNumber: vine.string().trim().maxLength(24).use(accountNumberFormat()),
  bsb: vine
    .string()
    .trim()
    .regex(AU_BSB)
    .nullable()
    .optional()
    .requiredWhen('countryCode', '=', 'AU'),
  instructions: vine.string().trim().maxLength(500).nullable().optional(),
})
