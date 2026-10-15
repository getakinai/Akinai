import vine from '@vinejs/vine'
import { vendorFields } from '#validators/helpers/vendor_fields'

export const adminVendorStoreValidator = vine.create(vendorFields())
