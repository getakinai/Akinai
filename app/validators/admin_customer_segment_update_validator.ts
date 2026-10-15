import vine from '@vinejs/vine'
import { customerSegmentFilterFields } from '#validators/helpers/customer_segment_fields'
import { customerSegmentNameSchema } from '#validators/admin_customer_segment_store_validator'

export const adminCustomerSegmentUpdateValidator = vine.create({
  name: customerSegmentNameSchema(),
  filters: vine.object(customerSegmentFilterFields({ strict: true })),
})
