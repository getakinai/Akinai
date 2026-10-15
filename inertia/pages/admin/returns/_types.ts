import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const RETURN_REASONS = [
  'size_too_small',
  'size_too_large',
  'not_as_described',
  'defective',
  'wrong_item',
  'changed_mind',
  'other',
] as const

export const ReturnReasonSchema = z.enum(RETURN_REASONS)

export type ReturnReason = z.infer<typeof ReturnReasonSchema>

export const RETURN_STATUSES = [
  'requested',
  'approved',
  'declined',
  'received',
  'closed',
  'cancelled',
] as const

export const ReturnStatusSchema = z.enum(RETURN_STATUSES)

export type ReturnStatus = z.infer<typeof ReturnStatusSchema>

export const ReturnStatusFilterSchema = z.enum(['', ...RETURN_STATUSES])

export type ReturnStatusFilter = z.infer<typeof ReturnStatusFilterSchema>

export const AdminReturnSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  number: z.number().int(),
  status: ReturnStatusSchema,
  customerNote: z.string().nullable(),
  declineReason: z.string().nullable(),
  staffNote: z.string().nullable(),
  refundId: z.uuid().nullable(),
  requestedAt: z.string(),
  approvedAt: z.string().nullable(),
  receivedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  lines: z.array(
    z.object({
      id: z.uuid(),
      lineItemId: z.uuid(),
      quantity: z.number().int(),
      reason: ReturnReasonSchema,
      note: z.string().nullable(),
      restock: z.boolean(),
      locationId: z.uuid().nullable(),
    })
  ),
})

export type AdminReturn = z.infer<typeof AdminReturnSchema>

export const AdminReturnResponseSchema = z.object({ data: AdminReturnSchema })

export const AdminOrderReturnsSchema = z.object({
  returnableLines: z.array(
    z.object({
      lineItemId: z.uuid(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      quantity: z.number().int(),
    })
  ),
  returns: z.array(AdminReturnSchema),
})

export type AdminOrderReturns = z.infer<typeof AdminOrderReturnsSchema>

export const AdminOrderReturnsResponseSchema = z.object({ data: AdminOrderReturnsSchema })

export const AdminReturnListItemSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  number: z.number().int(),
  status: ReturnStatusSchema,
  requestedAt: z.string(),
  createdAt: z.string(),
  itemCount: z.number().int(),
  order: z.object({ id: z.uuid(), label: z.string(), email: z.string().nullable() }).nullable(),
  customer: z
    .object({ id: z.uuid(), fullName: z.string().nullable(), email: z.string() })
    .nullable(),
})

export type AdminReturnListItem = z.infer<typeof AdminReturnListItemSchema>

export const AdminReturnsListQuerySchema = z.object({
  q: z.string().optional(),
  status: ReturnStatusFilterSchema.optional(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminReturnsListQuery = z.infer<typeof AdminReturnsListQuerySchema>

export const AdminReturnsListResponseSchema = paginatedResponse(AdminReturnListItemSchema)

export const AdminReturnStorePayloadSchema = z.object({
  lines: z
    .array(
      z.object({
        orderLineItemId: z.uuid(),
        quantity: z.number().int().min(1),
        reason: ReturnReasonSchema,
        note: z.string().max(500).nullable(),
      })
    )
    .min(1, 'Choose at least one item to return')
    .max(50),
  note: z.string().max(1000).nullable(),
})

export type AdminReturnStorePayload = z.infer<typeof AdminReturnStorePayloadSchema>

export const AdminReturnApprovePayloadSchema = z.object({
  staffNote: z.string().max(1000).nullable(),
  notifyCustomer: z.boolean(),
})

export type AdminReturnApprovePayload = z.infer<typeof AdminReturnApprovePayloadSchema>

export const AdminReturnDeclinePayloadSchema = z.object({
  reason: z.string().trim().min(1, 'Tell the customer why').max(500),
  notifyCustomer: z.boolean(),
})

export type AdminReturnDeclinePayload = z.infer<typeof AdminReturnDeclinePayloadSchema>

export const AdminReturnReceivePayloadSchema = z.object({
  lines: z
    .array(z.object({ id: z.uuid(), restock: z.boolean(), locationId: z.uuid().nullable() }))
    .max(50),
})

export type AdminReturnReceivePayload = z.infer<typeof AdminReturnReceivePayloadSchema>
