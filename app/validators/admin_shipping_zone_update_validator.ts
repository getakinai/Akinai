import vine from '@vinejs/vine'
import { shippingZoneFields } from '#validators/helpers/shipping_fields'

export const adminShippingZoneUpdateValidator = vine
  .withMetaData<{ shippingZoneId: string }>()
  .create(shippingZoneFields())
