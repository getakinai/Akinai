import vine from '@vinejs/vine'

/** Resend takes no body; the email id comes from the `:id` route param. */
export const adminEmailResendValidator = vine.create({})
