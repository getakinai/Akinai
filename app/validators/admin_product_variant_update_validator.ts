import vine from '@vinejs/vine'
import { variantFields } from '#validators/helpers/product_variant_fields'

const { optionValueIds, ...fields } = variantFields()

/**
 * `optionValueIds` is optional so the inline table can save prices and SKUs
 * without resending the variant's option values.
 */
export const adminProductVariantUpdateValidator = vine
  .withMetaData<{ variantId: string }>()
  .create({
    ...fields,
    optionValueIds: optionValueIds.optional(),
  })
