import vine from '@vinejs/vine'
import { DISCOUNT_TYPES } from '#models/discount'

/** The discount type picked in the "Select discount type" dialog. */
export const adminDiscountCreateQueryValidator = vine.create({
  type: vine.enum(DISCOUNT_TYPES),
})
