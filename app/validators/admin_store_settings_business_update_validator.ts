import vine from '@vinejs/vine'
import { BUSINESS_TYPES, SOLE_TRADER } from '#constants/store_settings'
import { addressSchemas } from '#validators/helpers/address_fields'
import { countryCodeSchema } from '#validators/helpers/country_codes'
import { phoneSchema } from '#validators/helpers/phone_fields'

const MIN_OWNER_AGE = 18

const adultRule = vine.createRule((value, _options, field) => {
  if (!field.isValid || !(value instanceof Date)) return
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - MIN_OWNER_AGE)
  if (value > cutoff) {
    field.report(`The owner must be at least ${MIN_OWNER_AGE} years old`, 'adult', field)
  }
})

export const adminStoreSettingsBusinessUpdateValidator = vine.create({
  businessCountryCode: countryCodeSchema(),
  businessType: vine.enum(BUSINESS_TYPES),
  legalName: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(150)
    .optional()
    .requiredWhen('businessType', '!=', SOLE_TRADER),
  ownerFirstName: vine.string().trim().minLength(1).maxLength(100),
  ownerLastName: vine.string().trim().minLength(1).maxLength(100),
  ownerDateOfBirth: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .before('today')
    .use(adultRule()),
  ownerEmail: vine.string().trim().maxLength(254).email(),
  ownerPhoneCountryCode: countryCodeSchema(),
  ownerPhone: phoneSchema('ownerPhoneCountryCode'),
  ownerAddressLine1: addressSchemas.line1(),
  ownerSuburb: addressSchemas.suburb(),
  ownerCity: addressSchemas.city(),
  ownerRegion: addressSchemas.region(),
  ownerPostalCode: addressSchemas.postalCode(),
})
