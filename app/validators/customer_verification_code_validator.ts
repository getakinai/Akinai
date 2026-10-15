import vine from '@vinejs/vine'
import { VERIFICATION_CODE_LENGTH } from '#constants/customer_verification'

export const customerVerificationCodeValidator = vine.create({
  code: vine.string().trim().fixedLength(VERIFICATION_CODE_LENGTH).regex(/^\d+$/),
})
