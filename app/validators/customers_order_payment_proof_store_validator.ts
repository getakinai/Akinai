import vine from '@vinejs/vine'
import {
  MAX_IMAGE_UPLOAD_SIZE_MB,
  MAX_PAYMENT_PROOF_DETAILS_LENGTH,
  PAYMENT_PROOF_EXTENSIONS,
} from '#constants/upload_limits'

export const customersOrderPaymentProofStoreValidator = vine.create({
  image: vine
    .file({ size: `${MAX_IMAGE_UPLOAD_SIZE_MB}mb`, extnames: PAYMENT_PROOF_EXTENSIONS })
    .optional(),
  details: vine.string().trim().maxLength(MAX_PAYMENT_PROOF_DETAILS_LENGTH).optional(),
})
