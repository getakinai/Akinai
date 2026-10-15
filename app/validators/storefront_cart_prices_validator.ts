import vine from '@vinejs/vine'
import { MAX_LINE_ITEMS } from '#validators/helpers/draft_order_fields'

/**
 * The variants in the shopper's browser cart, to reprice in their market.
 */
export const storefrontCartPricesValidator = vine.create({
  variantIds: vine.array(vine.string().uuid()).minLength(1).maxLength(MAX_LINE_ITEMS).distinct(),
})
