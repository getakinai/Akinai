import vine from '@vinejs/vine'

/**
 * Fields shared by the product type store and update validators.
 * `meta.productTypeId` (when set) is the type being edited so it does not
 * clash with itself.
 */
export function productTypeFields() {
  return {
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const productTypeId = field.meta.productTypeId as string | undefined
        const query = db.from('product_types').whereRaw('lower(name) = ?', [value.toLowerCase()])
        if (productTypeId) query.whereNot('id', productTypeId)
        return !(await query.first())
      }),
  }
}
