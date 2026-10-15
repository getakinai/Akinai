import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { REGION_CODES, regionName } from '#constants/country_regions'
import { ownedCountryCodesSchema, regionCodeSchema } from '#validators/helpers/country_codes'
import { shippingRateMarketPricesSchema } from '#validators/helpers/market_price_fields'
import { notBelowMinRule } from '#validators/helpers/min_max_rule'
import { weightAmount } from '#validators/helpers/weight_fields'

const MAX_AMOUNT = 9_999_999_999.99
const MAX_RATE_ITEMS = 10_000

/**
 * Fields shared by the shipping zone store and update validators.
 * `meta.shippingZoneId` (when set) is the zone being edited so it does not
 * clash with itself.
 */
export function shippingZoneFields() {
  return {
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (client, value, field) => {
        const zoneId = field.meta.shippingZoneId as string | undefined
        const query = client
          .from('shipping_zones')
          .whereRaw('lower(name) = ?', [value.toLowerCase()])
        if (zoneId) query.whereNot('id', zoneId)
        return !(await query.first())
      }),
    countryCodes: ownedCountryCodesSchema({
      table: 'shipping_zone_countries',
      ownerColumn: 'shipping_zone_id',
      ownerMetaKey: 'shippingZoneId',
      ownerLabel: 'shipping zone',
    }),
    regionCodes: vine
      .array(regionCodeSchema())
      .distinct()
      .maxLength(REGION_CODES.length)
      .use(ownedRegionsRule())
      .optional(),
  }
}

/**
 * A region can belong to only one shipping zone. Reports which regions
 * other zones already cover, naming the zone.
 */
const ownedRegionsRule = vine.createRule(async (value, _options, field) => {
  if (!field.isValid || !Array.isArray(value) || value.length === 0) return

  const zoneId = field.meta.shippingZoneId as string | undefined
  const query = db
    .from('shipping_zone_regions')
    .join('shipping_zones', 'shipping_zones.id', 'shipping_zone_regions.shipping_zone_id')
    .whereIn('shipping_zone_regions.region_code', value as string[])
    .select('shipping_zone_regions.region_code', 'shipping_zones.name')
    .orderBy('shipping_zone_regions.region_code', 'asc')
  if (zoneId) query.whereNot('shipping_zone_regions.shipping_zone_id', zoneId)
  const taken: { region_code: string; name: string }[] = await query

  if (taken.length > 0) {
    const names = taken.map((row) => `${regionName(row.region_code)} (${row.name})`).join(', ')
    field.report(
      `${names} already ${taken.length === 1 ? 'belongs' : 'belong'} to another shipping zone`,
      'ownedRegions',
      field
    )
  }
})

/**
 * Fields shared by the shipping rate store and update validators.
 */
export function shippingRateFields() {
  return {
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(255).nullable().optional(),
    price: vine.number({ strict: true }).min(0).max(MAX_AMOUNT).decimal([0, 2]),
    minSubtotal: vine.number({ strict: true }).min(0).max(MAX_AMOUNT).decimal([0, 2]).nullable(),
    maxSubtotal: vine
      .number({ strict: true })
      .min(0)
      .max(MAX_AMOUNT)
      .decimal([0, 2])
      .use(
        notBelowMinRule({
          minKey: 'minSubtotal',
          message: 'Maximum subtotal must be at least the minimum subtotal',
        })
      )
      .nullable(),
    minWeight: weightAmount().nullable().optional(),
    maxWeight: weightAmount()
      .use(
        notBelowMinRule({
          minKey: 'minWeight',
          message: 'Maximum weight must be at least the minimum weight',
        })
      )
      .nullable()
      .optional(),
    minItems: itemCount().nullable().optional(),
    maxItems: itemCount()
      .use(
        notBelowMinRule({
          minKey: 'minItems',
          message: 'Maximum items must be at least the minimum items',
        })
      )
      .nullable()
      .optional(),
    isActive: vine.boolean({ strict: true }),
    marketPrices: shippingRateMarketPricesSchema(),
  }
}

const itemCount = () => vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_RATE_ITEMS)
