import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import { isOnlinePaymentMethod } from '#constants/payment_methods'
import type Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import type CustomerAddress from '#models/customer_address'
import type Market from '#models/market'
import type Order from '#models/order'
import type { OrderAddress, OrderPaymentMethod } from '#models/order'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerAddressRepository from '#repositories/customer_address_repository'
import CustomerRepository, { marketingConsent } from '#repositories/customer_repository'
import OrderRepository from '#repositories/order_repository'
import AuditLogService from '#services/audit_log_service'
import DiscountCodeThrottleService from '#services/discount_code_throttle_service'
import DraftOrderService, {
  type DraftOrderQuote,
  type OrderQuoteInput,
} from '#services/draft_order_service'
import LocationService from '#services/location_service'
import OrderNotificationService from '#services/order_notification_service'
import { requireRegion } from '#services/helpers/address_region'
import { placedChanges } from '#services/order_audit'
import PaymentMethodService from '#services/payment_method_service'
import { orNullIfMissing } from '#utils/or_null_if_missing'

/** Session key holding ids of orders placed in this browser session. */
export const PLACED_ORDERS_SESSION_KEY = 'checkout.placedOrderIds'

export const MAX_REMEMBERED_ORDERS = 10

/** How long the checkout thank-you page stays viewable after an order. */
export const THANK_YOU_TTL_MINUTES = 30

export type CheckoutQuoteInput = {
  lineItems: { variantId: string; quantity: number }[]
  countryCode: string
  province?: string | null
  /** ISO 3166-2 code picked from the province list, for countries that have one. */
  regionCode?: string | null
  postalCode?: string | null
  shippingRateId?: string | null
  discountCode?: string | null
}

export type CheckoutPlaceInput = CheckoutQuoteInput & {
  email: string
  firstName?: string | null
  lastName: string
  address1: string
  address2?: string | null
  city: string
  phone?: string | null
  paymentMethod: OrderPaymentMethod
  saveAddress?: boolean
  /**
   * The "email me news and offers" box. Ticked subscribes the customer;
   * unticked leaves an earlier choice as it is.
   */
  acceptsMarketing?: boolean
  /** Generated once per checkout attempt; a repeat returns the same order. */
  idempotencyKey?: string | null
}

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'checkout' }])
}

/**
 * Prices the storefront cart and places orders for guests and signed-in
 * customers. Totals are always recomputed from current variant prices,
 * never taken from the browser.
 */
@inject()
export default class CheckoutService {
  constructor(
    protected draftOrderService: DraftOrderService,
    protected orderRepository: OrderRepository,
    protected customerRepository: CustomerRepository,
    protected customerAccountRepository: CustomerAccountRepository,
    protected customerAddressRepository: CustomerAddressRepository,
    protected locationService: LocationService,
    protected paymentMethodService: PaymentMethodService,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService,
    protected discountCodeThrottleService: DiscountCodeThrottleService
  ) {}

  /**
   * Prices the order, counting a rejected discount code against the
   * shopper's IP when one was entered.
   */
  protected priced(input: OrderQuoteInput, ipAddress: string | null): Promise<DraftOrderQuote> {
    if (!input.discountCode) return this.draftOrderService.quote(input)
    return this.discountCodeThrottleService.guard(ipAddress, () =>
      this.draftOrderService.quote(input)
    )
  }

  async customerFor(account: CustomerAccount | undefined): Promise<Customer | null> {
    return account ? this.customerAccountRepository.loadCustomer(account) : null
  }

  async savedAddresses(customer: Customer): Promise<CustomerAddress[]> {
    return this.customerAddressRepository.listForCustomer(customer.id)
  }

  /**
   * Prices the cart in the shopper's market. The delivery address only
   * decides the shipping rates.
   */
  async quote(
    input: CheckoutQuoteInput,
    customer: Customer | null,
    market: Market,
    ipAddress: string | null = null
  ): Promise<DraftOrderQuote> {
    return this.priced(
      {
        lineItems: input.lineItems,
        customer,
        marketId: market.id,
        address: {
          fullName: null,
          company: null,
          address1: '',
          address2: null,
          city: '',
          province: input.province ?? null,
          regionCode: input.regionCode ?? null,
          postalCode: input.postalCode ?? null,
          countryCode: input.countryCode,
          phone: null,
        },
        discountCode: input.discountCode,
        shippingRateId: input.shippingRateId,
        applyAutomatic: true,
      },
      ipAddress
    )
  }

  /**
   * Re-prices the cart and saves the order. Bank transfer orders are placed
   * straight away with payment pending. Card and POLi orders stay a hidden
   * pending checkout until the provider confirms the payment
   * (`OrderPaymentSettlementService.completeCheckout`). Guests are matched to an
   * existing guest profile by email or get a new one, which signup can
   * later claim. Emails with a registered account must sign in, so nobody
   * can add orders to another customer's history.
   */
  async place(
    input: CheckoutPlaceInput,
    signedIn: Customer | null,
    market: Market,
    ipAddress: string | null = null
  ): Promise<Order> {
    if (!(await this.paymentMethodService.isEnabled(input.paymentMethod, market))) {
      fieldError('paymentMethod', 'This payment method isn’t available')
    }

    const email = (signedIn?.email ?? input.email).toLowerCase()
    if (input.idempotencyKey) {
      const replayed = await this.replayedOrder(input.idempotencyKey, email)
      if (replayed) return replayed
    }

    const existing = signedIn ?? (await this.customerRepository.findByEmail(email))
    if (existing && !existing.isActive) {
      fieldError('email', 'This email can’t be used to place an order')
    }
    if (!signedIn && existing && (await this.customerAccountRepository.findByEmail(email))) {
      fieldError('email', 'Sign in to place an order with this email')
    }

    const { province, regionCode } = requireRegion(input)
    const address: OrderAddress = {
      fullName: [input.firstName, input.lastName].filter(Boolean).join(' '),
      company: null,
      address1: input.address1,
      address2: input.address2 ?? null,
      city: input.city,
      province,
      regionCode,
      postalCode: input.postalCode ?? null,
      countryCode: input.countryCode,
      phone: input.phone ?? null,
    }

    const quote = await this.priced(
      {
        lineItems: input.lineItems,
        customer: existing,
        marketId: market.id,
        address,
        email,
        discountCode: input.discountCode,
        shippingRateId: input.shippingRateId,
        applyAutomatic: true,
      },
      ipAddress
    )
    if (quote.shippingRates.length === 0) {
      fieldError('countryCode', 'We don’t ship to this address yet')
    }
    if (!quote.data.shippingRateId) fieldError('shippingRateId', 'Choose a shipping method')

    const location = await this.locationService.findDefault()
    const { order, replayed } = await this.orderRepository.placeOrder(
      { ...quote.data, customerId: existing?.id ?? null, email },
      quote.lines,
      {
        paymentMethod: input.paymentMethod,
        paymentStatus: 'pending',
        locationId: location?.id ?? null,
      },
      {
        guest: existing
          ? undefined
          : {
              fullName: address.fullName || null,
              email,
              phone: address.phone,
              ...(input.acceptsMarketing ? marketingConsent(true, 'checkout') : {}),
            },
        saveAddress: signedIn && input.saveAddress ? { ...address, isDefault: false } : undefined,
        idempotencyKey: input.idempotencyKey,
        awaitingPayment: isOnlinePaymentMethod(input.paymentMethod),
      }
    )
    if (replayed) return this.assertSameShopper(order, email)
    if (existing && input.acceptsMarketing) {
      await this.customerRepository.setMarketing(existing, true, 'checkout')
    }
    if (order.isPendingCheckout) return order

    const placed = await this.orderRepository.findDetailOrFail(order.id)
    await this.auditLogService.recordOrderEvent(placed, 'placed', placedChanges(placed), {
      userId: null,
      customerId: order.customerId,
      ipAddress,
    })
    await this.orderNotificationService.orderPlaced(placed.id, { notifyStaff: true })
    return order
  }

  /**
   * The order an earlier request with the same idempotency key placed.
   * Another shopper's key is rejected rather than revealing their order.
   */
  protected async replayedOrder(key: string, email: string): Promise<Order | null> {
    const order = await this.orderRepository.findByIdempotencyKey(key)
    return order ? this.assertSameShopper(order, email) : null
  }

  protected assertSameShopper(order: Order, email: string): Order {
    if (order.email?.toLowerCase() !== email) {
      fieldError('idempotencyKey', 'This checkout was already used. Refresh and try again.')
    }
    return order
  }

  /**
   * The order if it may be shown to this visitor: one placed in this
   * session, or one belonging to the signed-in customer. Card checkouts
   * still waiting for Stripe are only returned with `includePending`.
   */
  async findPlacedOrder(
    id: string,
    placedIds: string[],
    customer: Customer | null,
    { includePending = false } = {}
  ): Promise<Order | null> {
    const order = await orNullIfMissing(this.orderRepository.findDetailOrFail(id))
    if (!order) return null
    if (order.isDraft && !(includePending && order.isPendingCheckout)) return null
    const allowed = placedIds.includes(order.id) || (customer && order.customerId === customer.id)
    return allowed ? order : null
  }

  /**
   * The order for the thank-you page, which expires
   * `THANK_YOU_TTL_MINUTES` after the order was placed. Signed-in owners
   * see older orders in their account instead.
   */
  async findThankYouOrder(
    id: string,
    placedIds: string[],
    customer: Customer | null
  ): Promise<{ order: Order; expired: boolean } | null> {
    const order = await this.findPlacedOrder(id, placedIds, customer)
    if (!order) return null
    const placedAt = order.completedAt ?? order.createdAt
    const expired = placedAt.plus({ minutes: THANK_YOU_TTL_MINUTES }) < DateTime.now()
    return { order, expired }
  }
}
