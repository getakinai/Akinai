import vine from '@vinejs/vine'
import { vendorFields } from '#validators/helpers/vendor_fields'

export const adminVendorUpdateValidator = vine
  .withMetaData<{ vendorId: string }>()
  .create(vendorFields())
