import { DateTime } from 'luxon'
import { belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { bankTransferReference } from '#constants/bank_reference'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import Fulfillment from '#models/fulfillment'
import Market from '#models/market'
import OrderLineItem from '#models/order_line_item'
import OrderNote from '#models/order_note'
import OrderPaymentProof from '#models/order_payment_proof'
import OrderReturn from '#models/order_return'
import Refund from '#models/refund'

export const ORDER_STATUSES = ['draft', 'open', 'cancelled'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Orders that were placed (not drafts), cancelled or not. */
export const PLACED_ORDER_STATUSES: readonly OrderStatus[] = ['open', 'cancelled']

export const ORDER_PAYMENT_STATUSES = [
  'pending',
  'payment_submitted',
  'paid',
  'partially_refunded',
  'refunded',
  'voided',
] as const

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number]

/** Payment statuses staff pick by hand; the rest follow refunds and cancellation. */
export const MANUAL_PAYMENT_STATUSES = ['pending', 'paid'] as const

export type ManualPaymentStatus = (typeof MANUAL_PAYMENT_STATUSES)[number]

export const ORDER_FULFILLMENT_STATUSES = [
  'unfulfilled',
  'in_progress',
  'on_hold',
  'partially_fulfilled',
  'fulfilled',
] as const

export type OrderFulfillmentStatus = (typeof ORDER_FULFILLMENT_STATUSES)[number]

/** Statuses staff set by hand while nothing is fulfilled yet. */
export const MANUAL_FULFILLMENT_STATUSES = ['unfulfilled', 'in_progress', 'on_hold'] as const

export type ManualFulfillmentStatus = (typeof MANUAL_FULFILLMENT_STATUSES)[number]

export const ORDER_PAYMENT_METHODS = ['bank_transfer', 'stripe', 'poli'] as const

export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number]

export const CANCEL_REASONS = ['customer', 'inventory', 'fraud', 'declined', 'other'] as const

export type CancelReason = (typeof CANCEL_REASONS)[number]

/** Payment statuses where money was received (and may be refunded). */
export const PAID_PAYMENT_STATUSES: readonly OrderPaymentStatus[] = [
  'paid',
  'partially_refunded',
  'refunded',
]

export type OrderAddress = {
  fullName: string | null
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string | null
  /** ISO 3166-2 code of `province`, for countries with a region list. */
  regionCode?: string | null
  postalCode: string | null
  countryCode: string
  phone: string | null
}

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A draft built by staff, or a completed order. Customer, address,
 * discount, shipping and tax details are snapshots so a completed order
 * doesn't change when those records are edited.
 */
export default class Order extends BaseAppModel {
  @column()
  declare draftNumber: number

  @column()
  declare orderNumber: number | null

  @column()
  declare status: OrderStatus

  @column()
  declare paymentStatus: OrderPaymentStatus | null

  /** Set for storefront checkouts; null for staff-completed drafts. */
  @column()
  declare paymentMethod: OrderPaymentMethod | null

  /** Stripe Checkout Session id for card payments, or the POLi transaction token. */
  @column()
  declare paymentReference: string | null

  @column({ serializeAs: null })
  declare idempotencyKey: string | null

  @column()
  declare customerId: string | null

  @column()
  declare email: string | null

  @column()
  declare shippingAddressId: string | null

  @column({
    prepare: (value: OrderAddress | null) => (value ? JSON.stringify(value) : null),
  })
  declare shippingAddress: OrderAddress | null

  @column()
  declare marketId: string | null

  @column()
  declare currencyCode: string

  @column()
  declare pricesIncludeTax: boolean

  @column()
  declare discountId: string | null

  @column()
  declare discountCode: string | null

  @column()
  declare discountTitle: string | null

  /** Free-shipping discount, held apart from the main discount above. */
  @column()
  declare shippingDiscountId: string | null

  @column()
  declare shippingDiscountCode: string | null

  @column()
  declare shippingDiscountTitle: string | null

  @column({ consume: (value) => Number(value) })
  declare shippingDiscountTotal: number

  @column()
  declare shippingRateId: string | null

  @column()
  declare shippingTitle: string | null

  @column({ consume: toNumber })
  declare shippingPrice: number | null

  @column()
  declare taxName: string | null

  @column({ consume: toNumber })
  declare taxRate: number | null

  @column()
  declare taxAppliesToShipping: boolean

  @column({ consume: (value) => Number(value) })
  declare subtotal: number

  @column({ consume: (value) => Number(value) })
  declare discountTotal: number

  @column({ consume: (value) => Number(value) })
  declare shippingTotal: number

  @column({ consume: (value) => Number(value) })
  declare taxTotal: number

  @column({ consume: (value) => Number(value) })
  declare total: number

  /** The priced total while staff override `total`; null otherwise. */
  @column({ consume: toNumber })
  declare calculatedTotal: number | null

  @column()
  declare totalOverrideReason: string | null

  @column.dateTime()
  declare completedAt: DateTime | null

  /** When payment was received; null until paid. */
  @column.dateTime()
  declare paidAt: DateTime | null

  /** Progress of getting the items to the customer; independent of payment. */
  @column()
  declare fulfillmentStatus: OrderFulfillmentStatus

  @column.dateTime()
  declare archivedAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column()
  declare cancelReason: CancelReason | null

  /** Sum of refunds that succeeded or are still pending. */
  @column({ consume: (value) => Number(value) })
  declare refundedTotal: number

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Market)
  declare market: BelongsTo<typeof Market>

  @hasMany(() => OrderLineItem)
  declare lineItems: HasMany<typeof OrderLineItem>

  @hasMany(() => Fulfillment)
  declare fulfillments: HasMany<typeof Fulfillment>

  @hasMany(() => Refund)
  declare refunds: HasMany<typeof Refund>

  @hasMany(() => OrderReturn)
  declare returns: HasMany<typeof OrderReturn>

  @hasMany(() => OrderNote)
  declare notes: HasMany<typeof OrderNote>

  @hasOne(() => OrderPaymentProof)
  declare paymentProof: HasOne<typeof OrderPaymentProof>

  get isDraft() {
    return this.status === 'draft'
  }

  /**
   * A storefront online checkout (Stripe or POLi) waiting for payment. It stays a hidden draft
   * (no order number, stock or discount use) until the payment succeeds.
   */
  get isPendingCheckout() {
    return this.status === 'draft' && this.paymentMethod !== null
  }

  get isCancelled() {
    return this.status === 'cancelled'
  }

  /** Money was received for this order. */
  get isPaid() {
    return this.paymentStatus !== null && PAID_PAYMENT_STATUSES.includes(this.paymentStatus)
  }

  /** What can still be refunded: the total minus refunds already issued. */
  get refundableTotal() {
    if (!this.isPaid) return 0
    return Math.max(0, Math.round((this.total - this.refundedTotal) * 100) / 100)
  }

  /** Some items are in a successful fulfillment. */
  get hasFulfilledItems() {
    return (
      this.fulfillmentStatus === 'partially_fulfilled' || this.fulfillmentStatus === 'fulfilled'
    )
  }

  get isTotalOverridden() {
    return this.calculatedTotal !== null
  }

  /** Bank transfer orders where the customer may send (or replace) proof of payment. */
  get acceptsPaymentProof() {
    return (
      this.status === 'open' &&
      this.paymentMethod === 'bank_transfer' &&
      (this.paymentStatus === 'pending' || this.paymentStatus === 'payment_submitted')
    )
  }

  /** Placed orders staff may still edit: awaiting payment, or paid by bank transfer. */
  get isEditablePlaced() {
    return (
      this.status === 'open' &&
      this.refundedTotal === 0 &&
      (this.paymentStatus === 'pending' || this.paymentMethod === 'bank_transfer')
    )
  }

  /** What the customer quotes when paying by bank transfer, e.g. `HPDL1001`. */
  get bankReference(): string | null {
    if (this.paymentMethod !== 'bank_transfer' || this.orderNumber === null) return null
    return bankTransferReference(this.orderNumber)
  }
}
