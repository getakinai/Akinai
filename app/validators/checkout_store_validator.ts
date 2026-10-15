import vine from '@vinejs/vine'
import { ORDER_PAYMENT_METHODS } from '#models/order'
import { checkoutQuoteFields } from '#validators/helpers/checkout_fields'

export const checkoutStoreValidator = vine.create({
  ...checkoutQuoteFields(),
  email: vine.string().trim().email().maxLength(254),
  firstName: vine.string().trim().minLength(1).maxLength(100),
  lastName: vine.string().trim().minLength(1).maxLength(100),
  address1: vine.string().trim().minLength(1).maxLength(255),
  address2: vine.string().trim().maxLength(255).nullable().optional(),
  city: vine.string().trim().minLength(1).maxLength(100),
  province: vine.string().trim().minLength(1).maxLength(100),
  postalCode: vine.string().trim().minLength(1).maxLength(20),
  phone: vine.string().trim().minLength(1).maxLength(32),
  paymentMethod: vine.enum(ORDER_PAYMENT_METHODS),
  saveAddress: vine.boolean({ strict: true }).optional(),
  acceptsMarketing: vine.boolean({ strict: true }).optional(),
  idempotencyKey: vine.string().uuid().optional(),
})
