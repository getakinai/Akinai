import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { COUNTRY_CODES, countryName } from '#constants/countries'
import { REGION_CODES } from '#constants/country_regions'

type OwnedCountriesOptions = {
  /** Table that assigns a country to one owner, e.g. `market_countries`. */
  table: string
  /** Owner foreign key on that table, e.g. `market_id`. */
  ownerColumn: string
  /** Metadata key holding the owner being edited, so its own rows don't clash. */
  ownerMetaKey: string
  /** Owner noun used in the error message, e.g. `market`. */
  ownerLabel: string
}

/**
 * ISO country code, uppercased.
 */
export function countryCodeSchema() {
  return vine
    .string()
    .trim()
    .toUpperCase()
    .in([...COUNTRY_CODES])
}

/**
 * ISO 3166-2 code from the region catalog (e.g. `PH-CEB`), uppercased.
 * Whether it belongs to the address country is checked by the service.
 */
export function regionCodeSchema() {
  return vine
    .string()
    .trim()
    .toUpperCase()
    .in([...REGION_CODES])
}

/**
 * Country codes that can belong to only one owner (market, shipping zone).
 * Reports which countries another owner already covers.
 */
export function ownedCountryCodesSchema(options: OwnedCountriesOptions) {
  return vine
    .array(countryCodeSchema())
    .distinct()
    .maxLength(COUNTRY_CODES.length)
    .use(ownedCountriesRule(options))
}

/**
 * ISO country code covered by an active market. When `meta.customerId` is
 * set, that customer's saved country is also accepted, so archiving a
 * market doesn't block them from saving the rest of their profile.
 */
export function activeMarketCountryCodeSchema() {
  return countryCodeSchema().use(activeMarketCountryRule())
}

const activeMarketCountryRule = vine.createRule(async (value, _options, field) => {
  if (!field.isValid || typeof value !== 'string') return

  const customerId = field.meta.customerId as string | undefined
  if (customerId) {
    const saved = await db
      .from('customers')
      .where('id', customerId)
      .where('country_code', value)
      .first()
    if (saved) return
  }

  const covered = await db
    .from('market_countries')
    .join('markets', 'markets.id', 'market_countries.market_id')
    .where('markets.is_active', true)
    .where('market_countries.country_code', value)
    .first()

  if (!covered) {
    field.report("We don't sell to that country yet", 'activeMarketCountry', field)
  }
})

const ownedCountriesRule = vine.createRule(async (value, options: OwnedCountriesOptions, field) => {
  if (!field.isValid || !Array.isArray(value) || value.length === 0) return

  const ownerId = field.meta[options.ownerMetaKey] as string | undefined
  const query = db.from(options.table).whereIn('country_code', value as string[])
  if (ownerId) query.whereNot(options.ownerColumn, ownerId)
  const taken: { country_code: string }[] = await query.select('country_code')

  if (taken.length > 0) {
    const names = taken.map(({ country_code: code }) => countryName(code)).join(', ')
    field.report(
      `${names} already ${taken.length === 1 ? 'belongs' : 'belong'} to another ${options.ownerLabel}`,
      'ownedCountries',
      field
    )
  }
})
