import vine from '@vinejs/vine'
import { addressSchemas } from '#validators/helpers/address_fields'
import { countryCodeSchema } from '#validators/helpers/country_codes'

export const adminStoreSettingsAddressUpdateValidator = vine.create({
  storeAddressLine1: addressSchemas.line1(),
  storeSuburb: addressSchemas.suburb(),
  storeCity: addressSchemas.city(),
  storeRegion: addressSchemas.region(),
  storePostalCode: addressSchemas.postalCode(),
  storeCountryCode: countryCodeSchema(),
})
