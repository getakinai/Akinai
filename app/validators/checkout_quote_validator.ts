import vine from '@vinejs/vine'
import { checkoutQuoteFields } from '#validators/helpers/checkout_fields'

export const checkoutQuoteValidator = vine.create(checkoutQuoteFields())
