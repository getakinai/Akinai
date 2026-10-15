import vine from '@vinejs/vine'
import { TIMEZONES } from '#constants/store_settings'
import { activeMarketCountryCodeSchema, regionCodeSchema } from '#validators/helpers/country_codes'

/**
 * Profile fields shared by the admin store and update validators. Emails
 * are unique across profiles; `meta.customerId` (when set) is the profile
 * being edited so it does not clash with itself.
 */
export function customerProfileFields() {
  return {
    fullName: vine.string().trim().maxLength(255).nullable(),
    email: vine
      .string()
      .trim()
      .toLowerCase()
      .email()
      .maxLength(254)
      .unique(async (db, value, field) => {
        const customerId = field.meta.customerId as string | undefined
        const query = db.from('customers').where('email', value)
        if (customerId) query.whereNot('id', customerId)
        return !(await query.first())
      }),
    phone: vine.string().trim().maxLength(32).nullable(),
  }
}

/**
 * Country of origin (limited to countries in active markets) and IANA
 * timezone.
 */
export function customerLocationFields() {
  return {
    countryCode: activeMarketCountryCodeSchema(),
    timezone: vine
      .string()
      .trim()
      .in([...TIMEZONES]),
  }
}

/**
 * Location fields staff may leave empty (profiles created before the
 * customer picks a country).
 */
export function optionalCustomerLocationFields() {
  const { countryCode, timezone } = customerLocationFields()
  return {
    countryCode: countryCode.nullable().optional(),
    timezone: timezone.nullable().optional(),
  }
}

/**
 * Address fields shared by the admin address store and update validators.
 */
export function customerAddressFields() {
  return {
    fullName: vine.string().trim().maxLength(255).nullable(),
    company: vine.string().trim().maxLength(255).nullable(),
    address1: vine.string().trim().minLength(1).maxLength(255),
    address2: vine.string().trim().maxLength(255).nullable(),
    city: vine.string().trim().minLength(1).maxLength(100),
    province: vine.string().trim().maxLength(100).nullable(),
    regionCode: regionCodeSchema().nullable().optional(),
    postalCode: vine.string().trim().maxLength(20).nullable(),
    countryCode: vine
      .string()
      .trim()
      .fixedLength(2)
      .regex(/^[A-Za-z]{2}$/),
    phone: vine.string().trim().maxLength(32).nullable(),
    isDefault: vine.boolean({ strict: true }),
  }
}
