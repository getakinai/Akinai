import vine from '@vinejs/vine'

/**
 * Fields shared by the vendor store and update validators. `meta.vendorId`
 * (when set) is the vendor being edited so it does not clash with itself.
 */
export function vendorFields() {
  return {
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const vendorId = field.meta.vendorId as string | undefined
        const query = db.from('vendors').whereRaw('lower(name) = ?', [value.toLowerCase()])
        if (vendorId) query.whereNot('id', vendorId)
        return !(await query.first())
      }),
  }
}
