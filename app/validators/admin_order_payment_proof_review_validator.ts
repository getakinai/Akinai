import vine from '@vinejs/vine'
import { MAX_PAYMENT_PROOF_REJECTION_LENGTH } from '#constants/upload_limits'

export const PAYMENT_PROOF_DECISIONS = ['approve', 'reject'] as const

export const adminOrderPaymentProofReviewValidator = vine.create({
  decision: vine.enum(PAYMENT_PROOF_DECISIONS),
  reason: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(MAX_PAYMENT_PROOF_REJECTION_LENGTH)
    .optional()
    .requiredWhen('decision', '=', 'reject'),
})
