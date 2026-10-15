import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { countryCodeSchema } from '#validators/helpers/country_codes'

/**
 * Fields shared by the tax rate store and update validators. One rate per
 * country and region (or country-wide); `meta.taxRateId` (when set) is the
 * rate being edited so it does not clash with itself.
 */
export function taxRateFields() {
  return {
    name: vine.string().trim().minLength(1).maxLength(100),
    countryCode: countryCodeSchema().use(uniqueRegionRule()),
    regionCode: vine
      .string()
      .trim()
      .toUpperCase()
      .maxLength(10)
      .regex(/^[A-Z0-9-]+$/)
      .nullable(),
    rate: vine.number({ strict: true }).min(0).max(100).decimal([0, 4]),
    appliesToShipping: vine.boolean({ strict: true }),
  }
}

/**
 * Runs on `countryCode` because rules on a nullable `regionCode` skip null,
 * which is the country-wide case.
 */
const uniqueRegionRule = vine.createRule(async (value, _options, field) => {
  if (!field.isValid || typeof value !== 'string') return

  const rawRegion = field.parent.regionCode
  const regionCode =
    typeof rawRegion === 'string' && rawRegion.trim() !== '' ? rawRegion.trim().toUpperCase() : null
  const taxRateId = field.meta.taxRateId as string | undefined

  const query = db.from('tax_rates').where('country_code', value)
  if (regionCode) query.where('region_code', regionCode)
  else query.whereNull('region_code')
  if (taxRateId) query.whereNot('id', taxRateId)

  if (await query.first()) {
    field.report(
      regionCode
        ? `This country already has a rate for region ${regionCode}`
        : 'This country already has a country-wide rate',
      'uniqueRegion',
      field
    )
  }
})
