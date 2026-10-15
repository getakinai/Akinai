import { z } from 'zod'
import { requireListedProvince } from '~/lib/country_regions'

export const PAYMENT_METHODS = ['bank_transfer', 'stripe', 'poli'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const ONLINE_PAYMENT_METHODS = ['stripe', 'poli'] as const

export type OnlinePaymentMethod = (typeof ONLINE_PAYMENT_METHODS)[number]

export function isOnlinePayment(method: string | null | undefined): method is OnlinePaymentMethod {
  return method === 'stripe' || method === 'poli'
}

export const MAX_DISCOUNT_CODE_LENGTH = 64

export const CheckoutBankTransferSchema = z.object({
  countryCode: z.enum(['NZ', 'AU']),
  accountName: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  bsb: z.string().nullable(),
  instructions: z.string().nullable(),
})

export type CheckoutBankTransfer = z.infer<typeof CheckoutBankTransferSchema>

export const CheckoutPaymentMethodSchema = z.object({
  code: z.enum(PAYMENT_METHODS),
  name: z.string(),
  bankTransfer: CheckoutBankTransferSchema.nullable(),
})

export type CheckoutPaymentMethod = z.infer<typeof CheckoutPaymentMethodSchema>

export const CheckoutPaymentMethodsResponseSchema = z.object({
  data: z.array(CheckoutPaymentMethodSchema),
})

export const CheckoutSavedAddressSchema = z.object({
  id: z.string(),
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

export type CheckoutSavedAddress = z.infer<typeof CheckoutSavedAddressSchema>

export const CheckoutSavedAddressesResponseSchema = z.object({
  data: z.array(CheckoutSavedAddressSchema),
})

export const CheckoutLineItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
})

export type CheckoutLineItem = z.infer<typeof CheckoutLineItemSchema>

export const CheckoutQuoteInputSchema = z.object({
  lineItems: z.array(CheckoutLineItemSchema).min(1),
  countryCode: z.string().length(2),
  province: z.string().nullable(),
  regionCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  shippingRateId: z.string().nullable(),
  discountCode: z.string().nullable(),
})

export type CheckoutQuoteInput = z.infer<typeof CheckoutQuoteInputSchema>

export const CheckoutShippingRateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
})

export type CheckoutShippingRate = z.infer<typeof CheckoutShippingRateSchema>

export const CheckoutQuoteSchema = z.object({
  lineItems: z.array(
    z.object({
      variantId: z.string(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
      lineTotal: z.number(),
      discountAllocation: z.number(),
    })
  ),
  currencyCode: z.string(),
  pricesIncludeTax: z.boolean(),
  taxName: z.string().nullable(),
  taxCalculated: z.boolean(),
  shippingRateId: z.string().nullable(),
  shippingRates: z.array(CheckoutShippingRateSchema),
  discountCode: z.string().nullable(),
  discountTitle: z.string().nullable(),
  shippingDiscountCode: z.string().nullable(),
  shippingDiscountTitle: z.string().nullable(),
  subtotal: z.number(),
  discountTotal: z.number(),
  shippingDiscountTotal: z.number(),
  shippingTotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
})

export type CheckoutQuote = z.infer<typeof CheckoutQuoteSchema>

export const CheckoutQuoteResponseSchema = z.object({ data: CheckoutQuoteSchema })

const requiredText = (message: string) => z.string().trim().min(1, message)
const optionalText = z.string().trim().nullable()

export const CheckoutFormSchema = z
  .object({
    email: z.email('Enter a valid email'),
    countryCode: requiredText('Choose a country'),
    firstName: requiredText('Enter a first name'),
    lastName: requiredText('Enter a last name'),
    address1: requiredText('Enter an address'),
    address2: optionalText,
    city: requiredText('Enter a city'),
    province: requiredText('Enter a region'),
    regionCode: z.string().nullable(),
    postalCode: requiredText('Enter a postal code'),
    phone: requiredText('Enter a phone number'),
    shippingRateId: z.string().nullable(),
    paymentMethod: z.enum(PAYMENT_METHODS, 'Choose a payment method'),
    saveAddress: z.boolean(),
    discountCode: z.string().trim().max(MAX_DISCOUNT_CODE_LENGTH).nullable(),
    acceptsMarketing: z.boolean(),
  })
  .superRefine((value, ctx) => {
    requireListedProvince(value, ctx)
    if (!value.shippingRateId) {
      ctx.addIssue({
        code: 'custom',
        path: ['shippingRateId'],
        message: 'Choose a shipping method',
      })
    }
  })

export type CheckoutForm = z.infer<typeof CheckoutFormSchema>

export type PlaceOrderInput = CheckoutForm & {
  lineItems: CheckoutLineItem[]
  idempotencyKey: string
}

const OrderAddressSchema = z.object({
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

export const OrderFulfillmentStatusSchema = z.enum([
  'unfulfilled',
  'in_progress',
  'on_hold',
  'partially_fulfilled',
  'fulfilled',
])

export type OrderFulfillmentStatus = z.infer<typeof OrderFulfillmentStatusSchema>

export const CheckoutShipmentSchema = z.object({
  number: z.number(),
  trackingCompany: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  trackingUrl: z.string().nullable(),
  createdAt: z.string(),
  lines: z.array(
    z.object({
      lineItemId: z.string(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      quantity: z.number(),
    })
  ),
})

export type CheckoutShipment = z.infer<typeof CheckoutShipmentSchema>

export const CheckoutRefundSchema = z.object({
  id: z.string(),
  amount: z.number(),
  shippingAmount: z.number(),
  method: z.enum(['stripe', 'manual']),
  createdAt: z.string(),
  lines: z.array(z.object({ lineItemId: z.string(), quantity: z.number(), amount: z.number() })),
})

export type CheckoutRefund = z.infer<typeof CheckoutRefundSchema>

export const OrderPaymentStatusSchema = z.enum([
  'pending',
  'payment_submitted',
  'paid',
  'partially_refunded',
  'refunded',
  'voided',
])

export type OrderPaymentStatus = z.infer<typeof OrderPaymentStatusSchema>

export const PaymentProofSchema = z.object({
  details: z.string().nullable(),
  hasImage: z.boolean(),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
})

export type PaymentProof = z.infer<typeof PaymentProofSchema>

export const CheckoutOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.number().nullable(),
  bankReference: z.string().nullable(),
  bankTransfer: CheckoutBankTransferSchema.nullable(),
  email: z.string().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable(),
  paymentStatus: OrderPaymentStatusSchema.nullable(),
  fulfillmentStatus: OrderFulfillmentStatusSchema,
  currencyCode: z.string(),
  pricesIncludeTax: z.boolean(),
  shippingAddress: OrderAddressSchema.nullable(),
  shippingTitle: z.string().nullable(),
  taxName: z.string().nullable(),
  subtotal: z.number(),
  discountCode: z.string().nullable(),
  discountTitle: z.string().nullable(),
  discountTotal: z.number(),
  shippingDiscountTitle: z.string().nullable(),
  shippingDiscountTotal: z.number(),
  shippingTotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
  refundedTotal: z.number(),
  cancelledAt: z.string().nullable(),
  cancelled: z.boolean(),
  completedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  lineItems: z.array(
    z.object({
      id: z.string(),
      productTitle: z.string(),
      variantTitle: z.string().nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
      fulfilledQuantity: z.number(),
      lineTotal: z.number(),
    })
  ),
  fulfillments: z.array(CheckoutShipmentSchema),
  refunds: z.array(CheckoutRefundSchema),
  paymentProof: PaymentProofSchema.nullable(),
})

export type CheckoutOrder = z.infer<typeof CheckoutOrderSchema>

export const CheckoutOrderResponseSchema = z.object({ data: CheckoutOrderSchema })
