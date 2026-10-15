import vine from '@vinejs/vine'
import { countryCodeSchema, regionCodeSchema } from '#validators/helpers/country_codes'
import { MAX_LINE_ITEMS, MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'

/**
 * Cart lines plus the parts of the address that decide shipping rates and
 * tax. Shared by the checkout quote and store validators.
 */
export function checkoutQuoteFields() {
  return {
    lineItems: vine
      .array(
        vine.object({
          variantId: vine.string().uuid(),
          quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
        })
      )
      .minLength(1)
      .maxLength(MAX_LINE_ITEMS)
      .distinct('variantId'),
    countryCode: countryCodeSchema(),
    province: vine.string().trim().maxLength(100).nullable().optional(),
    regionCode: regionCodeSchema().nullable().optional(),
    postalCode: vine.string().trim().maxLength(20).nullable().optional(),
    shippingRateId: vine.string().uuid().nullable().optional(),
    discountCode: vine.string().trim().toUpperCase().maxLength(64).nullable().optional(),
  }
}
