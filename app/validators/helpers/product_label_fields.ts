import vine from '@vinejs/vine'
import { PRODUCT_LABEL_COLORS } from '#models/product_label'

/**
 * Fields shared by the product label store and update validators.
 * `meta.productLabelId` (when set) is the label being edited so it does not
 * clash with itself.
 */
export function productLabelFields() {
  return {
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(40)
      .unique(async (db, value, field) => {
        const productLabelId = field.meta.productLabelId as string | undefined
        const query = db.from('product_labels').whereRaw('lower(name) = ?', [value.toLowerCase()])
        if (productLabelId) query.whereNot('id', productLabelId)
        return !(await query.first())
      }),
    color: vine.enum(PRODUCT_LABEL_COLORS),
  }
}
