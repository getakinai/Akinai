import vine from '@vinejs/vine'
import { POLI_TOKEN } from '#validators/checkout_poli_return_validator'

/** POLi posts the transaction token as a form field named `Token`. */
export const poliNudgeValidator = vine.create({
  Token: vine.string().trim().maxLength(255).regex(POLI_TOKEN),
})
