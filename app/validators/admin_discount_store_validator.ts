import vine from '@vinejs/vine'
import { discountFields } from '#validators/helpers/discount_fields'

export const adminDiscountStoreValidator = vine.create(discountFields())
