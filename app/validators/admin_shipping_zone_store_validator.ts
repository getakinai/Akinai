import vine from '@vinejs/vine'
import { shippingZoneFields } from '#validators/helpers/shipping_fields'

export const adminShippingZoneStoreValidator = vine.create(shippingZoneFields())
