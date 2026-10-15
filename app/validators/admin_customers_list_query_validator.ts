import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'
import { customerSegmentFilterFields } from '#validators/helpers/customer_segment_fields'

export const ADMIN_CUSTOMERS_SORT_KEYS = ['fullName', 'email', 'createdAt'] as const

export const adminCustomersListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_CUSTOMERS_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
  // Query-string values arrive as text, so the segment numbers are coerced (bounded in the helper).
  ...customerSegmentFilterFields({ strict: false }),
})
