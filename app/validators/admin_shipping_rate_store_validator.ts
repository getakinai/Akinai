import vine from '@vinejs/vine'
import { shippingRateFields } from '#validators/helpers/shipping_fields'

export const adminShippingRateStoreValidator = vine.create(shippingRateFields())
