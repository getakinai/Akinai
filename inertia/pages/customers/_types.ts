import { z } from 'zod'
import { requireListedProvince } from '~/lib/country_regions'
import { paginatedResponse } from '~/lib/schemas'
import { OrderFulfillmentStatusSchema, OrderPaymentStatusSchema } from '~/pages/checkout/_types'

export const CustomerSchema = z.object({
  id: z.uuid(),
  fullName: z.string().nullable(),
  email: z.email(),
  phone: z.string().nullable(),
  countryCode: z.string().nullable(),
  countryName: z.string().nullable(),
  timezone: z.string().nullable(),
  acceptsMarketing: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type Customer = z.infer<typeof CustomerSchema>

export const CustomerMarketingFormSchema = z.object({ acceptsMarketing: z.boolean() })

export type CustomerMarketingForm = z.infer<typeof CustomerMarketingFormSchema>

export const CustomerMeResponseSchema = z.object({ data: CustomerSchema })

const CustomerLocationFieldsSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/, 'Choose your country'),
  timezone: z.string().min(1, 'Choose your timezone').max(64),
})

export const CustomerDetailsFormSchema = CustomerLocationFieldsSchema.extend({
  fullName: z.string().trim().max(255).nullable(),
  email: z.email('Enter a valid email').trim().max(254),
  phone: z.string().trim().max(32).nullable(),
  currentPassword: z.string().max(255).optional(),
})

export type CustomerDetailsForm = z.infer<typeof CustomerDetailsFormSchema>

export const CUSTOMER_LOCATION_RETURN_TO = ['account', 'checkout'] as const

export const CustomerLocationReturnToSchema = z.enum(CUSTOMER_LOCATION_RETURN_TO)

export type CustomerLocationReturnTo = z.infer<typeof CustomerLocationReturnToSchema>

export const CustomerLocationFormSchema = CustomerLocationFieldsSchema.extend({
  returnTo: CustomerLocationReturnToSchema,
})

export type CustomerLocationForm = z.infer<typeof CustomerLocationFormSchema>

export const CustomerLocationOptionsSchema = z.object({
  countries: z.array(
    z.object({ code: z.string(), name: z.string(), timezones: z.array(z.string()) })
  ),
  timezones: z.array(z.string()),
})

export type CustomerLocationOptions = z.infer<typeof CustomerLocationOptionsSchema>

export const CustomerLocationOptionsResponseSchema = z.object({
  data: CustomerLocationOptionsSchema,
})

export const CustomerOrderSchema = z.object({
  id: z.uuid(),
  orderNumber: z.number().nullable(),
  paymentStatus: OrderPaymentStatusSchema.nullable(),
  paymentMethod: z.enum(['bank_transfer', 'stripe', 'poli']).nullable(),
  fulfillmentStatus: OrderFulfillmentStatusSchema,
  currencyCode: z.string(),
  shippingTitle: z.string().nullable(),
  total: z.number(),
  cancelled: z.boolean(),
  itemCount: z.number(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
})

export type CustomerOrder = z.infer<typeof CustomerOrderSchema>

export const CustomerOrdersResponseSchema = paginatedResponse(CustomerOrderSchema)

export const CustomerAddressSchema = z.object({
  id: z.uuid(),
  fullName: z.string().nullable(),
  company: z.string().nullable(),
  address1: z.string(),
  address2: z.string().nullable(),
  city: z.string(),
  province: z.string().nullable(),
  regionCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string(),
  phone: z.string().nullable(),
  isDefault: z.boolean(),
})

export type CustomerAddress = z.infer<typeof CustomerAddressSchema>

export const CustomerAddressesResponseSchema = z.object({ data: z.array(CustomerAddressSchema) })

export const CustomerAddressResponseSchema = z.object({ data: CustomerAddressSchema })

export const CustomerAddressDeleteResponseSchema = z.null()

export const CustomerAddressFormSchema = z
  .object({
    fullName: z.string().trim().max(255).nullable(),
    company: z.string().trim().max(255).nullable(),
    address1: z.string().trim().min(1, 'Enter the street address').max(255),
    address2: z.string().trim().max(255).nullable(),
    city: z.string().trim().min(1, 'Enter the city').max(100),
    province: z.string().trim().max(100).nullable(),
    regionCode: z.string().nullable(),
    postalCode: z.string().trim().max(20).nullable(),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, 'Choose a country')
      .transform((value) => value.toUpperCase()),
    phone: z.string().trim().max(32).nullable(),
    isDefault: z.boolean(),
  })
  .superRefine(requireListedProvince)

export type CustomerAddressForm = z.infer<typeof CustomerAddressFormSchema>

const ActivityValuesSchema = z.record(z.string(), z.unknown())

export const CustomerActivitySchema = z.object({
  id: z.uuid(),
  action: z.enum(['updated', 'deleted']),
  auditableType: z.string(),
  auditableLabel: z.string().nullable(),
  changes: z.object({
    before: ActivityValuesSchema,
    after: ActivityValuesSchema.nullable(),
  }),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
})

export type CustomerActivity = z.infer<typeof CustomerActivitySchema>

export const CustomerActivityResponseSchema = paginatedResponse(CustomerActivitySchema)

export { CheckoutOrderResponseSchema as CustomerOrderDetailResponseSchema } from '~/pages/checkout/_types'
export type { CheckoutOrder as CustomerOrderDetail, PaymentProof } from '~/pages/checkout/_types'

export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024

export const PAYMENT_PROOF_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Proof of a bank transfer payment: a screenshot, payment details, or both. */
export const PaymentProofFormSchema = z
  .object({
    image: z
      .instanceof(File)
      .refine((file) => (PAYMENT_PROOF_IMAGE_TYPES as readonly string[]).includes(file.type), {
        message: 'Use a JPG, PNG or WebP image',
      })
      .refine((file) => file.size <= PAYMENT_PROOF_MAX_BYTES, {
        message: 'The image must be 5 MB or smaller',
      })
      .nullable(),
    details: z.string().trim().max(1000, 'Keep the details under 1000 characters'),
  })
  .refine((form) => form.image !== null || form.details.length > 0, {
    message: 'Add a screenshot or the payment details',
    path: ['details'],
  })

export type PaymentProofForm = z.infer<typeof PaymentProofFormSchema>

const CustomerOrderNoteReplySchema = z.object({
  id: z.uuid(),
  body: z.string(),
  createdAt: z.string(),
  fromCustomer: z.boolean(),
})

export const CustomerOrderNoteSchema = CustomerOrderNoteReplySchema.extend({
  replies: z.array(CustomerOrderNoteReplySchema),
})

export type CustomerOrderNote = z.infer<typeof CustomerOrderNoteSchema>

export const CustomerOrderNotesResponseSchema = z.object({
  data: z.array(CustomerOrderNoteSchema),
})

export const CustomerOrderNoteReplyResponseSchema = z.object({ data: CustomerOrderNoteSchema })

export const CustomerOrderNoteReplyFormSchema = z.object({
  parentId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'Write a reply')
    .max(2000, 'Keep your reply under 2000 characters'),
})

export type CustomerOrderNoteReplyForm = z.infer<typeof CustomerOrderNoteReplyFormSchema>

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

export const CustomerReturnSchema = z.object({
  id: z.uuid(),
  number: z.number(),
  status: ReturnStatusSchema,
  customerNote: z.string().nullable(),
  declineReason: z.string().nullable(),
  requestedAt: z.string(),
  approvedAt: z.string().nullable(),
  receivedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  lines: z.array(
    z.object({ lineItemId: z.uuid(), quantity: z.number(), reason: ReturnReasonSchema })
  ),
})

export type CustomerReturn = z.infer<typeof CustomerReturnSchema>

export const CustomerOrderReturnsSchema = z.object({
  returnWindowEndsAt: z.string().nullable(),
  returnableLines: z.array(
    z.object({
      lineItemId: z.uuid(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      quantity: z.number(),
      windowEndsAt: z.string().nullable(),
    })
  ),
  returns: z.array(CustomerReturnSchema),
})

export type CustomerOrderReturns = z.infer<typeof CustomerOrderReturnsSchema>

export const CustomerOrderReturnsResponseSchema = z.object({ data: CustomerOrderReturnsSchema })

export const CustomerReturnResponseSchema = z.object({ data: CustomerReturnSchema })

/** Body of the return request endpoint. */
export const CustomerReturnRequestSchema = z.object({
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

export type CustomerReturnRequest = z.infer<typeof CustomerReturnRequestSchema>
