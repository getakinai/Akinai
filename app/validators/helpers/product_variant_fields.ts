import vine from '@vinejs/vine'
import { variantMarketPricesSchema } from '#validators/helpers/market_price_fields'
import { MAX_PRODUCT_OPTIONS } from '#validators/helpers/product_options'
import { weightAmount } from '#validators/helpers/weight_fields'

/**
 * Variant fields shared by the store and update validators. SKUs are unique
 * across every product, ignoring case; `meta.variantId` (when set) is the
 * variant being edited so it does not clash with itself.
 */
export function variantFields() {
  return {
    optionValueIds: vine.array(vine.string().uuid()).distinct().maxLength(MAX_PRODUCT_OPTIONS),
    sku: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(64)
      .unique(async (db, value, field) => {
        const variantId = field.meta.variantId as string | undefined
        const query = db.from('product_variants').whereRaw('lower(sku) = ?', [value.toLowerCase()])
        if (variantId) query.whereNot('id', variantId)
        return !(await query.first())
      })
      .nullable(),
    barcode: vine.string().trim().minLength(1).maxLength(64).nullable(),
    price: vine.number({ strict: true }).min(0).max(9_999_999_999.99).decimal([0, 2]),
    compareAtPrice: vine
      .number({ strict: true })
      .min(0)
      .max(9_999_999_999.99)
      .decimal([0, 2])
      .nullable(),
    weight: weightAmount().nullable().optional(),
    trackInventory: vine.boolean({ strict: true }),
    marketPrices: variantMarketPricesSchema(),
  }
}
