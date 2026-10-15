import vine from '@vinejs/vine'
import { countryCodeSchema } from '#validators/helpers/country_codes'
import { phoneSchema } from '#validators/helpers/phone_fields'

export const adminStoreSettingsContactUpdateValidator = vine.create({
  storeName: vine.string().trim().minLength(2).maxLength(100),
  contactEmail: vine.string().trim().maxLength(254).email(),
  phoneCountryCode: countryCodeSchema().nullable(),
  phone: phoneSchema('phoneCountryCode').nullable(),
})
