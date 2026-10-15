import vine from '@vinejs/vine'
import {
  CURRENCY_CODES,
  CURRENCY_DISPLAYS,
  DATE_FORMATS,
  LOCALES,
  MAX_RETURN_WINDOW_DAYS,
  TIMEZONES,
  UNIT_SYSTEMS,
  WEIGHT_UNITS,
} from '#constants/store_settings'
import { countryCodeSchema } from '#validators/helpers/country_codes'

export const adminStoreSettingsDefaultsUpdateValidator = vine.create({
  operatingCountryCode: countryCodeSchema().nullable().optional(),
  currencyCode: vine
    .string()
    .trim()
    .toUpperCase()
    .in([...CURRENCY_CODES]),
  currencyDisplay: vine.enum(CURRENCY_DISPLAYS),
  locale: vine.enum(LOCALES),
  dateFormat: vine.enum(DATE_FORMATS),
  timezone: vine
    .string()
    .trim()
    .in([...TIMEZONES]),
  unitSystem: vine.enum(UNIT_SYSTEMS),
  weightUnit: vine.enum(WEIGHT_UNITS),
  returnWindowDays: vine
    .number({ strict: true })
    .withoutDecimals()
    .min(0)
    .max(MAX_RETURN_WINDOW_DAYS),
})
