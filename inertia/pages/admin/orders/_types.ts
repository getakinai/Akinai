import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { RecordActivitySchema } from '../_audit_types'

export const ADMIN_ORDERS_SORT_KEYS = ['number', 'total', 'createdAt'] as const

export const AdminOrdersSortKeySchema = z.enum(ADMIN_ORDERS_SORT_KEYS)

export type AdminOrdersSortKey = z.infer<typeof AdminOrdersSortKeySchema>

export const OrderStatusSchema = z.enum(['draft', 'open', 'cancelled'])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const ORDER_PAYMENT_STATUSES = [
  'pending',
  'payment_submitted',
  'paid',
  'partially_refunded',
  'refunded',
  'voided',
] as const

export const OrderPaymentStatusSchema = z.enum(ORDER_PAYMENT_STATUSES)

export type OrderPaymentStatus = z.infer<typeof OrderPaymentStatusSchema>

/** Payment statuses staff can set by hand on a draft or placed order. */
export const ManualPaymentStatusSchema = z.enum(['pending', 'paid'])

export type ManualPaymentStatus = z.infer<typeof ManualPaymentStatusSchema>

export const AdminOrderPaymentFilterSchema = z.enum(['', ...ORDER_PAYMENT_STATUSES])

export type AdminOrderPaymentFilter = z.infer<typeof AdminOrderPaymentFilterSchema>

export const ORDER_FULFILLMENT_STATUSES = [
  'unfulfilled',
  'in_progress',
  'on_hold',
  'partially_fulfilled',
  'fulfilled',
] as const

export const OrderFulfillmentStatusSchema = z.enum(ORDER_FULFILLMENT_STATUSES)

export type OrderFulfillmentStatus = z.infer<typeof OrderFulfillmentStatusSchema>

/** Statuses staff set by hand while nothing is fulfilled yet. */
export const ManualFulfillmentStatusSchema = z.enum(['unfulfilled', 'in_progress', 'on_hold'])

export type ManualFulfillmentStatus = z.infer<typeof ManualFulfillmentStatusSchema>

export const AdminOrderFulfillmentFilterSchema = z.enum(['', ...ORDER_FULFILLMENT_STATUSES])

export type AdminOrderFulfillmentFilter = z.infer<typeof AdminOrderFulfillmentFilterSchema>

/** `active` hides archived orders, `archived` shows only them, `all` shows both. */
export const AdminOrderArchiveFilterSchema = z.enum(['active', 'archived', 'all'])

export type AdminOrderArchiveFilter = z.infer<typeof AdminOrderArchiveFilterSchema>

const OrderCustomerSchema = z
  .object({ id: z.uuid(), fullName: z.string().nullable(), email: z.string() })
  .nullable()

export const OrderAddressSchema = z.object({
  fullName: z.string().nullable(),
  company: z.string().nullable(),
  address1: z.string(),
  address2: z.string().nullable(),
  city: z.string(),
  province: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string(),
  phone: z.string().nullable(),
})

export type OrderAddress = z.infer<typeof OrderAddressSchema>

const orderSummary = {
  id: z.uuid(),
  draftNumber: z.number(),
  orderNumber: z.number().nullable(),
  bankReference: z.string().nullable(),
  status: OrderStatusSchema,
  paymentStatus: OrderPaymentStatusSchema.nullable(),
  paymentMethod: z.enum(['bank_transfer', 'stripe', 'poli']).nullable(),
  fulfillmentStatus: OrderFulfillmentStatusSchema,
  archivedAt: z.string().nullable(),
  customerId: z.uuid().nullable(),
  email: z.string().nullable(),
  currencyCode: z.string(),
  subtotal: z.number(),
  total: z.number(),
  refundedTotal: z.number(),
  cancelledAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  customer: OrderCustomerSchema,
}

export const AdminOrderListItemSchema = z.object(orderSummary)

export type AdminOrderListItem = z.infer<typeof AdminOrderListItemSchema>

export const AdminOrderLineItemSchema = z.object({
  id: z.uuid(),
  productVariantId: z.uuid().nullable(),
  productTitle: z.string(),
  variantTitle: z.string().nullable(),
  sku: z.string().nullable(),
  unitPrice: z.number(),
  quantity: z.number(),
  fulfilledQuantity: z.number(),
  refundedQuantity: z.number(),
  removedQuantity: z.number(),
  lineTotal: z.number(),
  position: z.number(),
})

export type AdminOrderLineItem = z.infer<typeof AdminOrderLineItemSchema>

export const AdminFulfillmentSchema = z.object({
  id: z.uuid(),
  number: z.number(),
  status: z.enum(['success', 'cancelled']),
  trackingCompany: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  trackingUrl: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  lines: z.array(
    z.object({
      lineItemId: z.uuid(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      quantity: z.number(),
    })
  ),
})

export type AdminFulfillment = z.infer<typeof AdminFulfillmentSchema>

export const FulfillmentTrackingPayloadSchema = z.object({
  trackingCompany: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  trackingUrl: z.string().nullable(),
  notifyCustomer: z.boolean().optional(),
})

export type FulfillmentTrackingPayload = z.infer<typeof FulfillmentTrackingPayloadSchema>

/** Body of the create fulfillment endpoint. */
export const AdminFulfillmentStorePayloadSchema = FulfillmentTrackingPayloadSchema.extend({
  lineItems: z.array(z.object({ lineItemId: z.uuid(), quantity: z.number().int().min(1) })).min(1),
})

export type AdminFulfillmentStorePayload = z.infer<typeof AdminFulfillmentStorePayloadSchema>

export const REFUND_METHODS = ['stripe', 'manual'] as const

export const AdminRefundSchema = z.object({
  id: z.uuid(),
  returnId: z.uuid().nullable(),
  amount: z.number(),
  shippingAmount: z.number(),
  method: z.enum(REFUND_METHODS),
  status: z.enum(['pending', 'succeeded', 'failed']),
  note: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
  lines: z.array(
    z.object({
      lineItemId: z.uuid(),
      quantity: z.number(),
      amount: z.number(),
      restock: z.boolean(),
    })
  ),
})

export type AdminRefund = z.infer<typeof AdminRefundSchema>

export const RefundLinesPayloadSchema = z.object({
  lines: z.array(z.object({ lineItemId: z.uuid(), quantity: z.number().int().min(1) })),
  shipping: z.number().min(0),
})

export type RefundLinesPayload = z.infer<typeof RefundLinesPayloadSchema>

/** Body of the refund store endpoint. */
export const AdminRefundStorePayloadSchema = RefundLinesPayloadSchema.extend({
  amount: z.number().min(0.01),
  restock: z.boolean(),
  locationId: z.uuid().nullable(),
  note: z.string().max(500).nullable(),
  notifyCustomer: z.boolean(),
  returnId: z.uuid().nullable().optional(),
})

export type AdminRefundStorePayload = z.infer<typeof AdminRefundStorePayloadSchema>

export const RefundQuoteSchema = z.object({
  lines: z.array(z.object({ lineItemId: z.uuid(), quantity: z.number(), amount: z.number() })),
  shipping: z.number(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  maximum: z.number(),
  shippingRefundable: z.number(),
})

export type RefundQuote = z.infer<typeof RefundQuoteSchema>

export const RefundQuoteResponseSchema = z.object({ data: RefundQuoteSchema })

export const CANCEL_REASONS = ['customer', 'inventory', 'fraud', 'declined', 'other'] as const

export const CancelReasonSchema = z.enum(CANCEL_REASONS)

export type CancelReason = z.infer<typeof CancelReasonSchema>

/** Body of the cancel order endpoint. */
export const AdminOrderCancelPayloadSchema = z.object({
  reason: CancelReasonSchema,
  restock: z.boolean(),
  refund: z.boolean(),
  notifyCustomer: z.boolean(),
  staffNote: z.string().max(500).nullable(),
})

export type AdminOrderCancelPayload = z.infer<typeof AdminOrderCancelPayloadSchema>

export const AdminOrderDetailSchema = z.object({
  ...orderSummary,
  shippingAddressId: z.uuid().nullable(),
  shippingAddress: OrderAddressSchema.nullable(),
  marketId: z.uuid().nullable(),
  pricesIncludeTax: z.boolean(),
  discountId: z.uuid().nullable(),
  discountCode: z.string().nullable(),
  discountTitle: z.string().nullable(),
  shippingDiscountId: z.uuid().nullable(),
  shippingDiscountCode: z.string().nullable(),
  shippingDiscountTitle: z.string().nullable(),
  shippingDiscountTotal: z.number(),
  shippingRateId: z.uuid().nullable(),
  shippingTitle: z.string().nullable(),
  shippingPrice: z.number().nullable(),
  taxName: z.string().nullable(),
  taxRate: z.number().nullable(),
  taxAppliesToShipping: z.boolean(),
  discountTotal: z.number(),
  shippingTotal: z.number(),
  taxTotal: z.number(),
  calculatedTotal: z.number().nullable(),
  totalOverrideReason: z.string().nullable(),
  cancelReason: z.string().nullable(),
  paidAt: z.string().nullable(),
  isTotalOverridden: z.boolean(),
  canEditPlaced: z.boolean(),
  lineItems: z.array(AdminOrderLineItemSchema),
  fulfillments: z.array(AdminFulfillmentSchema),
  refunds: z.array(AdminRefundSchema),
  paymentProof: z
    .object({
      details: z.string().nullable(),
      hasImage: z.boolean(),
      submittedAt: z.string(),
      reviewedAt: z.string().nullable(),
      rejectionReason: z.string().nullable(),
    })
    .nullable(),
})

export type AdminOrderDetail = z.infer<typeof AdminOrderDetailSchema>

export type AdminPaymentProof = NonNullable<AdminOrderDetail['paymentProof']>

export const AdminPaymentProofReviewPayloadSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({ decision: z.literal('reject'), reason: z.string().trim().min(1).max(500) }),
])

export type AdminPaymentProofReviewPayload = z.infer<typeof AdminPaymentProofReviewPayloadSchema>

/** Body of the placed order update endpoint. */
export const AdminOrderUpdatePayloadSchema = z.object({
  paymentStatus: ManualPaymentStatusSchema,
  lineItems: z
    .array(
      z.object({
        lineItemId: z.uuid().optional(),
        variantId: z.uuid().optional(),
        quantity: z.number().int().min(1).max(9999),
      })
    )
    .min(1),
  totalOverride: z.number().min(0).nullable(),
  totalOverrideReason: z.string().nullable(),
})

export type AdminOrderUpdatePayload = z.infer<typeof AdminOrderUpdatePayloadSchema>

export const AdminOrderActivityResponseSchema = paginatedResponse(RecordActivitySchema)

export const AdminOrdersListQuerySchema = z.object({
  q: z.string(),
  sort: AdminOrdersSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  paymentStatus: AdminOrderPaymentFilterSchema.optional(),
  fulfillmentStatus: AdminOrderFulfillmentFilterSchema.optional(),
  archive: AdminOrderArchiveFilterSchema.optional(),
  customerId: z.uuid().optional(),
})

export type AdminOrdersListQuery = z.infer<typeof AdminOrdersListQuerySchema>

export const AdminOrdersListResponseSchema = paginatedResponse(AdminOrderListItemSchema)

export const AdminOrderResponseSchema = z.object({ data: AdminOrderDetailSchema })

export const AdminOrderDeleteResponseSchema = z.null()

export const OrderVariantOptionSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  productTitle: z.string(),
  title: z.string(),
  sku: z.string().nullable(),
  price: z.number(),
  trackInventory: z.boolean(),
  available: z.number().nullable(),
})

export type OrderVariantOption = z.infer<typeof OrderVariantOptionSchema>

export const OrderVariantOptionsResponseSchema = z.object({
  data: z.array(OrderVariantOptionSchema),
})

/** Body of the draft calculate, store and update endpoints. */
export const DraftOrderPayloadSchema = z.object({
  lineItems: z.array(
    z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(9999) })
  ),
  customerId: z.uuid().nullable(),
  shippingAddressId: z.uuid().nullable(),
  marketId: z.uuid().nullable(),
  discountCode: z.string().nullable(),
  shippingRateId: z.uuid().nullable(),
})

export type DraftOrderPayload = z.infer<typeof DraftOrderPayloadSchema>

export const DraftOrderQuoteSchema = z.object({
  lineItems: z.array(
    z.object({
      productVariantId: z.uuid(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      sku: z.string().nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
      lineTotal: z.number(),
    })
  ),
  market: z.object({
    id: z.uuid(),
    name: z.string(),
    currencyCode: z.string(),
    pricesIncludeTax: z.boolean(),
  }),
  discount: z.object({ id: z.uuid(), code: z.string().nullable(), title: z.string() }).nullable(),
  shippingDiscount: z
    .object({ id: z.uuid(), code: z.string().nullable(), title: z.string() })
    .nullable(),
  tax: z.object({ name: z.string(), rate: z.number(), appliesToShipping: z.boolean() }).nullable(),
  taxCalculated: z.boolean(),
  shippingRateId: z.uuid().nullable(),
  shippingRates: z.array(z.object({ id: z.uuid(), name: z.string(), price: z.number() })),
  subtotal: z.number(),
  discountTotal: z.number(),
  shippingDiscountTotal: z.number(),
  shippingTotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
})

export type DraftOrderQuote = z.infer<typeof DraftOrderQuoteSchema>

export const DraftOrderQuoteResponseSchema = z.object({ data: DraftOrderQuoteSchema })

/** A line in the form: variant details kept for display between quotes. */
export type DraftLine = {
  variantId: string
  productTitle: string
  variantTitle: string | null
  sku: string | null
  unitPrice: number
  /** `null` while the quantity field is empty. */
  quantity: number | null
}

export type DraftCustomer = { id: string; fullName: string | null; email: string }

export const OrderNoteVisibilitySchema = z.enum(['internal', 'customer'])

export type OrderNoteVisibility = z.infer<typeof OrderNoteVisibilitySchema>

export const AdminOrderNoteSchema = z.object({
  id: z.uuid(),
  visibility: OrderNoteVisibilitySchema,
  body: z.string(),
  author: z.string().nullable(),
  createdAt: z.string(),
  replies: z.array(
    z.object({ id: z.uuid(), body: z.string(), createdAt: z.string(), author: z.string() })
  ),
})

export type AdminOrderNote = z.infer<typeof AdminOrderNoteSchema>

export const AdminOrderNotesListResponseSchema = z.object({
  data: z.array(AdminOrderNoteSchema),
})

export const AdminOrderNoteStorePayloadSchema = z.object({
  visibility: OrderNoteVisibilitySchema,
  body: z.string().trim().min(1, 'Enter a note').max(2000),
})

export type AdminOrderNoteStorePayload = z.infer<typeof AdminOrderNoteStorePayloadSchema>

export const AdminOrderNoteResponseSchema = z.object({ data: AdminOrderNoteSchema })
