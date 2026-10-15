import vine from '@vinejs/vine'
import { MAX_CUSTOMER_SEGMENT_NAME_LENGTH } from '#constants/customer_marketing'
import { escapeLike } from '#repositories/helpers/like'
import { customerSegmentFilterFields } from '#validators/helpers/customer_segment_fields'

/** Segment names are unique regardless of case. */
export function customerSegmentNameSchema() {
  return vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(MAX_CUSTOMER_SEGMENT_NAME_LENGTH)
    .unique(async (db, value, field) => {
      const query = db.from('customer_segments').whereILike('name', escapeLike(value))
      const id = field.meta.segmentId as string | undefined
      if (id) query.whereNot('id', id)
      return !(await query.first())
    })
}

export const adminCustomerSegmentStoreValidator = vine.create({
  name: customerSegmentNameSchema(),
  filters: vine.object(customerSegmentFilterFields({ strict: true })),
})
