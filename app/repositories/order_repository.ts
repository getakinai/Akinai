import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors } from '@vinejs/vine'
import { parseBankTransferReference } from '#constants/bank_reference'
import { isOnlinePaymentMethod } from '#constants/payment_methods'
import Discount from '#models/discount'
import InventoryLevel from '#models/inventory_level'
import Order, {
  PAID_PAYMENT_STATUSES,
  PLACED_ORDER_STATUSES,
  type CancelReason,
  type ManualFulfillmentStatus,
  type OrderAddress,
  type OrderFulfillmentStatus,
  type OrderPaymentMethod,
  type OrderPaymentStatus,
  type OrderStatus,
} from '#models/order'
import OrderLineItem from '#models/order_line_item'
import ProductVariant from '#models/product_variant'
import CustomerAddressRepository, {
  type CustomerAddressData,
} from '#repositories/customer_address_repository'
import CustomerRepository, { type CustomerProfileData } from '#repositories/customer_repository'
import { unfulfilledQuantity } from '#repositories/fulfillment_repository'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { caseIncrement } from '#repositories/helpers/case_increment'
import { containsPattern } from '#repositories/helpers/like'
import { applyStockMoves } from '#repositories/helpers/stock_moves'

export type OrderDraftData = {
  customerId: string | null
  email: string | null
  shippingAddressId: string | null
  shippingAddress: OrderAddress | null
  marketId: string | null
  currencyCode: string
  pricesIncludeTax: boolean
  discountId: string | null
  discountCode: string | null
  discountTitle: string | null
  shippingDiscountId: string | null
  shippingDiscountCode: string | null
  shippingDiscountTitle: string | null
  shippingDiscountTotal: number
  shippingRateId: string | null
  shippingTitle: string | null
  shippingPrice: number | null
  taxName: string | null
  taxRate: number | null
  taxAppliesToShipping: boolean
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  total: number
}

export type OrderLineData = {
  productVariantId: string
  productTitle: string
  variantTitle: string | null
  sku: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
  /** This line's share of the main discount. */
  discountAllocation: number
  taxable: boolean
}

/** A line on a placed order; kept lines may point at a deleted variant. */
export type PlacedOrderLineData = Omit<OrderLineData, 'productVariantId'> & {
  productVariantId: string | null
}

export type PlacedOrderData = Pick<
  OrderDraftData,
  'subtotal' | 'discountTotal' | 'shippingDiscountTotal' | 'shippingTotal' | 'taxTotal' | 'total'
> & {
  paymentStatus: OrderPaymentStatus
  calculatedTotal: number | null
  totalOverrideReason: string | null
}

export type OrderSortKey = 'number' | 'total' | 'createdAt'

export type PaginateOrdersData = {
  /** `open` lists placed orders, cancelled ones included. */
  status: OrderStatus
  q?: string
  customerId?: string
  paymentStatus?: OrderPaymentStatus
  fulfillmentStatus?: OrderFulfillmentStatus
  /** true: archived only; false: not archived; undefined: both. */
  archived?: boolean
  sort: OrderSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

export type CompleteOrderData = {
  paymentStatus: OrderPaymentStatus
  locationId: string | null
}

export type PlaceOrderExtras = {
  /** Profile to create for a first-time guest; becomes the order's customer. */
  guest?: CustomerProfileData
  /** Address to add to the customer's address book. */
  saveAddress?: CustomerAddressData
  idempotencyKey?: string | null
  /**
   * Keeps the order a hidden draft until the card payment succeeds
   * (`completePaidCheckout`). Stock and discount limits are checked but
   * nothing is committed.
   */
  awaitingPayment?: boolean
}

function isUniqueViolation(error: unknown, column: string): boolean {
  const pg = error as { code?: string; constraint?: string; detail?: string }
  return (
    pg?.code === '23505' &&
    (pg.constraint?.includes(column) === true || pg.detail?.includes(column) === true)
  )
}

const FIRST_ORDER_NUMBER = 1001

/** Serializes number assignment across concurrent transactions. */
const NUMBER_LOCK_KEY = 7_340_001

function lineName(line: Pick<OrderLineItem, 'productTitle' | 'variantTitle'>) {
  return line.variantTitle ? `${line.productTitle} (${line.variantTitle})` : line.productTitle
}

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'order' }])
}

export default class OrderRepository {
  async paginate({
    status,
    q,
    customerId,
    paymentStatus,
    fulfillmentStatus,
    archived,
    sort,
    direction,
    page,
    perPage,
  }: PaginateOrdersData) {
    const numberColumn = status === 'draft' ? 'orders.draft_number' : 'orders.order_number'
    const sortColumns: Record<OrderSortKey, string> = {
      number: numberColumn,
      total: 'orders.total',
      createdAt: status === 'draft' ? 'orders.created_at' : 'orders.completed_at',
    }

    return Order.query()
      .if(
        status === 'draft',
        (query) => query.where('orders.status', 'draft').whereNull('orders.payment_method'),
        (query) => query.whereIn('orders.status', [...PLACED_ORDER_STATUSES])
      )
      .preload('customer')
      .if(customerId, (query) => query.where('orders.customer_id', customerId!))
      .if(paymentStatus, (query) => query.where('orders.payment_status', paymentStatus!))
      .if(fulfillmentStatus, (query) =>
        query.where('orders.fulfillment_status', fulfillmentStatus!)
      )
      .if(archived !== undefined, (query) =>
        archived ? query.whereNotNull('orders.archived_at') : query.whereNull('orders.archived_at')
      )
      .if(q, (query) => {
        const referenced = status === 'open' ? parseBankTransferReference(q!) : null
        if (referenced !== null) {
          query
            .where('orders.order_number', referenced)
            .where('orders.payment_method', 'bank_transfer')
          return
        }
        const digits = q!.replace(/\D/g, '')
        query.where((group) => {
          group
            .whereILike('orders.email', containsPattern(q))
            .orWhereHas('customer', (customer) =>
              customer
                .whereILike('full_name', containsPattern(q))
                .orWhereILike('email', containsPattern(q))
            )
          if (digits) group.orWhere(numberColumn, Number(digits))
        })
      })
      .orderBy(sortColumns[sort], direction)
      .orderBy('orders.id', direction)
      .paginate(page, perPage)
  }

  /**
   * A customer's placed orders, newest first, with `itemCount` (total
   * quantity) in `$extras`.
   */
  async paginateForCustomer(customerId: string, page: number, perPage: number) {
    return Order.query()
      .select(
        'orders.id',
        'orders.order_number',
        'orders.status',
        'orders.payment_status',
        'orders.payment_method',
        'orders.fulfillment_status',
        'orders.currency_code',
        'orders.shipping_title',
        'orders.total',
        'orders.completed_at',
        'orders.created_at'
      )
      .where('orders.customer_id', customerId)
      .whereIn('orders.status', [...PLACED_ORDER_STATUSES])
      .withAggregate('lineItems', (query) => query.sum('quantity').as('itemCount'))
      .orderBy('orders.completed_at', 'desc')
      .orderBy('orders.id', 'desc')
      .paginate(page, perPage)
  }

  async findForCustomerOrFail(customerId: string, id: string): Promise<Order> {
    return Order.query()
      .where('id', id)
      .where('customer_id', customerId)
      .whereIn('status', [...PLACED_ORDER_STATUSES])
      .preload('lineItems', (query) => query.orderBy('position', 'asc'))
      .preload('fulfillments', (query) =>
        query.where('status', 'success').orderBy('number', 'asc').preload('lines')
      )
      .preload('refunds', (query) =>
        query.whereNot('status', 'failed').orderBy('created_at', 'desc').preload('lines')
      )
      .preload('paymentProof')
      .firstOrFail()
  }

  async findOrFail(id: string): Promise<Order> {
    return Order.findOrFail(id)
  }

  /** Paid orders with no `paid_at` get their `completed_at`, in one statement. */
  async backfillPaidAt(): Promise<number> {
    const updated = await Order.query()
      .whereNull('paid_at')
      .whereNotNull('completed_at')
      .whereIn('payment_status', [...PAID_PAYMENT_STATUSES])
      .update({ paid_at: db.raw('completed_at') })
    return Number(updated[0] ?? 0)
  }

  async find(id: string): Promise<Order | null> {
    return Order.find(id)
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    return Order.findBy('idempotency_key', key)
  }

  async findDetailOrFail(id: string): Promise<Order> {
    return Order.query()
      .where('id', id)
      .preload('customer')
      .preload('lineItems', (query) => query.orderBy('position', 'asc'))
      .preload('fulfillments', (query) => query.orderBy('number', 'asc').preload('lines'))
      .preload('refunds', (query) =>
        query
          .orderBy('created_at', 'desc')
          .preload('lines')
          .preload('createdBy', (user) => user.select('id', 'full_name', 'email'))
      )
      .preload('paymentProof')
      .firstOrFail()
  }

  /** The order with what its emails show: lines, shipments and the customer's account. */
  async findForNotificationOrFail(id: string): Promise<Order> {
    return Order.query()
      .where('id', id)
      .preload('customer', (query) => query.preload('account'))
      .preload('lineItems', (query) => query.orderBy('position', 'asc'))
      .preload('fulfillments', (query) => query.orderBy('number', 'asc').preload('lines'))
      .firstOrFail()
  }

  /**
   * Sets a manual fulfillment status (unfulfilled, in progress, on hold).
   * Throws a validation error once items are fulfilled, since the status
   * then follows the fulfilled quantities.
   */
  async setFulfillmentStatus(order: Order, status: ManualFulfillmentStatus): Promise<Order> {
    return db.transaction(async (trx) => {
      const locked = await Order.query({ client: trx })
        .where('id', order.id)
        .forUpdate()
        .firstOrFail()
      if (locked.hasFulfilledItems) {
        fieldError('status', 'The status follows the fulfilled items once anything is fulfilled')
      }
      locked.useTransaction(trx)
      locked.$skipAudit = true
      return locked.merge({ fulfillmentStatus: status }).save()
    })
  }

  async setArchivedAt(order: Order, archivedAt: DateTime | null): Promise<Order> {
    return order.merge({ archivedAt }).save()
  }

  /** Archives or unarchives placed orders; drafts and ones already in that state are skipped. */
  async setArchivedAtMany(ids: string[], archivedAt: DateTime | null): Promise<Order[]> {
    return bulkUpdate(Order, ids, { archivedAt }, (query) => {
      query.whereIn('status', [...PLACED_ORDER_STATUSES])
      if (archivedAt) query.whereNull('archived_at')
      else query.whereNotNull('archived_at')
    })
  }

  /**
   * Variants by id with their product, for pricing a draft.
   */
  async findVariants(ids: string[]): Promise<ProductVariant[]> {
    if (ids.length === 0) return []
    return ProductVariant.query().whereIn('id', ids).preload('product')
  }

  /**
   * Which of `discountIds` the customer already used on a completed order,
   * as the main or the shipping discount (for once-per-customer discounts).
   */
  async discountsUsedByCustomer(customerId: string, discountIds: string[]): Promise<Set<string>> {
    if (discountIds.length === 0) return new Set()
    const rows = await Order.query()
      .where('customer_id', customerId)
      .where('status', 'open')
      .where((query) =>
        query.whereIn('discount_id', discountIds).orWhereIn('shipping_discount_id', discountIds)
      )
      .select('discount_id', 'shipping_discount_id')
    const wanted = new Set(discountIds)
    return new Set(
      rows
        .flatMap(({ discountId, shippingDiscountId }) => [discountId, shippingDiscountId])
        .filter((id): id is string => id !== null && wanted.has(id))
    )
  }

  async createDraft(data: OrderDraftData, lines: OrderLineData[]): Promise<Order> {
    return db.transaction(async (trx) => {
      await this.lockNumbers(trx)
      const draftNumber = (await this.maxNumber('draft_number', trx)) + 1
      const order = await Order.create(
        {
          ...data,
          draftNumber,
          orderNumber: null,
          status: 'draft',
          paymentStatus: null,
          completedAt: null,
        },
        { client: trx }
      )
      await this.writeLines(order.id, lines, trx)
      return order
    })
  }

  /**
   * Saves the draft and replaces its line items in one transaction.
   */
  async updateDraft(order: Order, data: OrderDraftData, lines: OrderLineData[]): Promise<Order> {
    return db.transaction(async (trx) => {
      order.useTransaction(trx)
      order.$skipAudit = true
      await order.merge(data).save()
      await OrderLineItem.query({ client: trx }).where('order_id', order.id).delete()
      await this.writeLines(order.id, lines, trx)
      return order
    })
  }

  /**
   * Saves staff edits to a placed order: replaces the line items and moves
   * the stock difference of tracked variants between available and
   * committed at the location. A pending Stripe order loses its Checkout
   * Session so the next payment attempt charges the new total. Throws a
   * validation error (and rolls back) when stock is short or the order can
   * no longer be edited.
   */
  async updatePlaced(
    order: Order,
    data: PlacedOrderData,
    lines: PlacedOrderLineData[],
    locationId: string | null
  ): Promise<Order> {
    return db.transaction(async (trx) => {
      const locked = await Order.query({ client: trx })
        .where('id', order.id)
        .forUpdate()
        .firstOrFail()
      if (!locked.isEditablePlaced) fieldError('order', 'This order can no longer be edited')

      const previous = await OrderLineItem.query({ client: trx })
        .select('product_variant_id', 'quantity')
        .where('order_id', locked.id)
      const changes = this.quantityChanges(previous, lines)
      const productsChanged = changes.size > 0 || previous.length !== lines.length
      if (productsChanged && locked.hasFulfilledItems) {
        fieldError('lineItems', 'Products can’t be changed once items are fulfilled')
      }
      await this.moveStock(changes, locationId, trx)

      locked.useTransaction(trx)
      locked.$skipAudit = true
      const wasPaid = locked.paymentStatus === 'paid'
      locked.merge(data)
      if (data.paymentStatus === 'paid' && !wasPaid) locked.paidAt = DateTime.now()
      else if (!locked.isPaid) locked.paidAt = null
      if (isOnlinePaymentMethod(locked.paymentMethod) && data.paymentStatus === 'pending') {
        locked.paymentReference = null
      }
      await locked.save()
      if (productsChanged) {
        await OrderLineItem.query({ client: trx }).where('order_id', locked.id).delete()
        await this.writeLines(locked.id, lines, trx)
      }
      return locked
    })
  }

  async deleteDraft(order: Order): Promise<void> {
    await order.delete()
  }

  async lineItems(orderId: string): Promise<OrderLineItem[]> {
    return OrderLineItem.query().where('order_id', orderId).orderBy('position', 'asc')
  }

  async setPaymentReference(orderId: string, reference: string): Promise<void> {
    await Order.query()
      .where('id', orderId)
      .update({ payment_reference: reference, updated_at: new Date() })
  }

  /**
   * Marks a pending storefront order as paid. Returns false when the order
   * was already paid or doesn't exist, so repeated webhooks are no-ops.
   */
  async markPaid(orderId: string, reference: string): Promise<boolean> {
    const updated = await Order.query()
      .where('id', orderId)
      .where('status', 'open')
      .where('payment_status', 'pending')
      .update({
        payment_status: 'paid',
        payment_reference: reference,
        paid_at: new Date(),
        updated_at: new Date(),
      })
    return Number(updated[0] ?? 0) > 0
  }

  /**
   * Cancels an open order in one transaction: sets the status and reason,
   * voids an unpaid payment, marks every unshipped unit as removed and
   * releases its committed stock (back to `available` when `restock` is
   * on). Throws a validation error (and rolls back) when the order isn't
   * open or still has an active fulfillment.
   */
  async cancel(
    orderId: string,
    {
      reason,
      restock,
      locationId,
    }: { reason: CancelReason; restock: boolean; locationId: string | null }
  ): Promise<{ order: Order; released: number }> {
    return db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('id', orderId)
        .forUpdate()
        .firstOrFail()
      if (order.status !== 'open') fieldError('order', 'Only open orders can be cancelled')
      const active = await trx
        .from('fulfillments')
        .where('order_id', order.id)
        .where('status', 'success')
        .count('* as total')
        .first()
      if (Number(active?.total ?? 0) > 0) {
        fieldError('order', 'Cancel the fulfillments first')
      }

      const lines = await OrderLineItem.query({ client: trx })
        .where('order_id', order.id)
        .forUpdate()
      const removals = lines
        .map((line) => ({ line, units: unfulfilledQuantity(line) }))
        .filter(({ units }) => units > 0)
      await caseIncrement(
        trx,
        'order_line_items',
        'removed_quantity',
        removals.map(({ line, units }) => ({ id: line.id, change: units }))
      )
      if (locationId) {
        await applyStockMoves(
          trx,
          removals.flatMap(({ line, units }) =>
            line.productVariantId
              ? [
                  {
                    variantId: line.productVariantId,
                    locationId,
                    committed: -units,
                    available: restock ? units : 0,
                  },
                ]
              : []
          )
        )
      }

      order.useTransaction(trx)
      order.$skipAudit = true
      order.merge({
        status: 'cancelled',
        cancelledAt: DateTime.now(),
        cancelReason: reason,
        paymentStatus: order.isPaid ? order.paymentStatus : 'voided',
      })
      await order.save()
      return { order, released: removals.reduce((sum, { units }) => sum + units, 0) }
    })
  }

  /**
   * Records a payment that arrived after the order was cancelled (its
   * Checkout page was still open), so it can be refunded. False when the
   * order is not a cancelled, unpaid order.
   */
  async markPaidAfterCancel(orderId: string, reference: string): Promise<boolean> {
    const updated = await Order.query()
      .where('id', orderId)
      .where('status', 'cancelled')
      .where('payment_status', 'voided')
      .update({
        payment_status: 'paid',
        payment_reference: reference,
        paid_at: new Date(),
        updated_at: new Date(),
      })
    return Number(updated[0] ?? 0) > 0
  }

  /**
   * Turns a draft into an order: assigns the order number, moves stock of
   * tracked variants from available to committed at the location, and
   * counts a use of the discount. Throws a validation error (and rolls
   * back) when stock is short or the discount ran out of uses.
   */
  async complete(order: Order, data: CompleteOrderData): Promise<Order> {
    return db.transaction(async (trx) => {
      const locked = await Order.query({ client: trx })
        .where('id', order.id)
        .forUpdate()
        .firstOrFail()
      if (locked.status !== 'draft') fieldError('order', 'This order is already completed')
      const { order: completed } = await this.finalize(locked, data, trx)
      return completed
    })
  }

  /**
   * Places a card checkout once Stripe confirms the payment: the hidden
   * draft becomes a paid order. The shopper has already paid, so short
   * stock or a used-up discount don't stop it; `oversold` names the lines
   * staff need to sort out. Null when it was already placed (the return
   * page and the webhook both call this) or isn't a pending checkout.
   */
  async completePaidCheckout(
    orderId: string,
    reference: string,
    locationId: string | null
  ): Promise<{ order: Order; oversold: string[] } | null> {
    return db.transaction(async (trx) => {
      const locked = await Order.query({ client: trx }).where('id', orderId).forUpdate().first()
      if (!locked?.isPendingCheckout) return null
      locked.paymentReference = reference
      return this.finalize(locked, { paymentStatus: 'paid', locationId }, trx, {
        allowOversell: true,
      })
    })
  }

  /**
   * Creates a draft and completes it in one transaction, together with the
   * guest's customer profile and the saved address, so a failed checkout
   * (short stock, used-up discount) leaves nothing behind.
   *
   * A repeated `idempotencyKey` (double submit, retried request) returns
   * the order the first request placed instead of placing a second one.
   */
  async placeOrder(
    data: OrderDraftData,
    lines: OrderLineData[],
    complete: CompleteOrderData & { paymentMethod: OrderPaymentMethod },
    { guest, saveAddress, idempotencyKey, awaitingPayment = false }: PlaceOrderExtras = {}
  ): Promise<{ order: Order; replayed: boolean }> {
    try {
      const order = await db.transaction(async (trx) => {
        const guestProfile = guest ? await new CustomerRepository().create(guest, trx) : null
        const customerId = guestProfile?.id ?? data.customerId
        await this.lockNumbers(trx)
        const draftNumber = (await this.maxNumber('draft_number', trx)) + 1
        const draft = await Order.create(
          {
            ...data,
            customerId,
            idempotencyKey: idempotencyKey ?? null,
            draftNumber,
            orderNumber: null,
            status: 'draft',
            paymentStatus: null,
            paymentMethod: complete.paymentMethod,
            completedAt: null,
          },
          { client: trx }
        )
        await this.writeLines(draft.id, lines, trx)
        let placed = draft
        if (awaitingPayment) {
          await this.assertPlaceable(draft, complete.locationId, trx)
        } else {
          const finalized = await this.finalize(draft, complete, trx)
          placed = finalized.order
        }
        if (saveAddress && customerId) {
          await new CustomerAddressRepository().create(customerId, saveAddress, trx)
        }
        return placed
      })
      return { order, replayed: false }
    } catch (error) {
      const existing =
        idempotencyKey && isUniqueViolation(error, 'idempotency_key')
          ? await this.findByIdempotencyKey(idempotencyKey)
          : null
      if (!existing) throw error
      return { order: existing, replayed: true }
    }
  }

  /**
   * Fails the way `finalize` would when stock or a discount has run out,
   * without committing anything.
   */
  protected async assertPlaceable(
    order: Order,
    locationId: string | null,
    trx: TransactionClientContract
  ) {
    const lines = await this.finalizableLines(order.id, trx)
    const tracked = lines.filter((line) => line.variant?.trackInventory)
    const levels =
      locationId && tracked.length > 0
        ? await InventoryLevel.query({ client: trx })
            .select('product_variant_id', 'available')
            .whereIn(
              'product_variant_id',
              tracked.map((line) => line.productVariantId!)
            )
            .where('location_id', locationId)
        : []
    const available = new Map(levels.map((level) => [level.productVariantId, level.available]))
    for (const line of tracked) {
      const inStock = available.get(line.productVariantId!) ?? 0
      if (inStock < line.quantity) {
        fieldError('lineItems', `Only ${Math.max(inStock, 0)} in stock for ${lineName(line)}`)
      }
    }

    const discountIds = [order.discountId, order.shippingDiscountId].filter(
      (id): id is string => id !== null
    )
    if (discountIds.length === 0) return
    const usedUp = await Discount.query({ client: trx })
      .select('id')
      .whereIn('id', discountIds)
      .whereNotNull('usage_limit')
      .whereRaw('usage_count >= usage_limit')
      .first()
    if (usedUp) fieldError('discountCode', 'This discount has reached its usage limit')
  }

  protected async finalizableLines(orderId: string, trx: TransactionClientContract) {
    const lines = await OrderLineItem.query({ client: trx })
      .where('order_id', orderId)
      .preload('variant')
      .orderBy('position', 'asc')
    if (lines.length === 0) fieldError('lineItems', 'Add at least one product')
    return lines
  }

  /**
   * Turns a locked or just-created draft into an order inside `trx`. With
   * `allowOversell`, short stock goes below zero and used-up discounts are
   * still counted instead of failing; `oversold` lists the short lines.
   */
  protected async finalize(
    order: Order,
    { paymentStatus, locationId }: CompleteOrderData,
    trx: TransactionClientContract,
    { allowOversell = false } = {}
  ): Promise<{ order: Order; oversold: string[] }> {
    const lines = await this.finalizableLines(order.id, trx)

    const oversold: string[] = []
    for (const line of lines) {
      if (!line.variant?.trackInventory) continue
      const inStock = await this.commitStock(line, locationId, trx, allowOversell)
      if (!inStock) oversold.push(lineName(line))
    }

    // At most two discounts (main and shipping), each counted atomically.
    for (const discountId of [order.discountId, order.shippingDiscountId]) {
      if (!discountId) continue
      const updated = await Discount.query({ client: trx })
        .where('id', discountId)
        .if(!allowOversell, (query) =>
          query.where((limit) =>
            limit.whereNull('usage_limit').orWhereRaw('usage_count < usage_limit')
          )
        )
        .increment('usage_count', 1)
      if (Number(updated[0] ?? 0) === 0 && !allowOversell) {
        fieldError('discountCode', 'This discount has reached its usage limit')
      }
    }

    await this.lockNumbers(trx)
    const lastNumber = await this.maxNumber('order_number', trx)
    order.useTransaction(trx)
    order.$skipAudit = true
    order.merge({
      status: 'open',
      paymentStatus,
      orderNumber: Math.max(lastNumber + 1, FIRST_ORDER_NUMBER),
      completedAt: DateTime.now(),
      paidAt: paymentStatus === 'paid' ? DateTime.now() : null,
    })
    await order.save()
    return { order, oversold }
  }

  /**
   * Moves the line's quantity from available to committed. Returns false
   * when stock was short; that throws unless `allowOversell` is on.
   */
  protected async commitStock(
    line: OrderLineItem,
    locationId: string | null,
    trx: TransactionClientContract,
    allowOversell = false
  ): Promise<boolean> {
    const level = locationId
      ? await InventoryLevel.query({ client: trx })
          .where('product_variant_id', line.productVariantId!)
          .where('location_id', locationId)
          .forUpdate()
          .first()
      : null

    const available = level?.available ?? 0
    const inStock = level !== null && available >= line.quantity
    if (!inStock && !allowOversell) {
      fieldError('lineItems', `Only ${Math.max(available, 0)} in stock for ${lineName(line)}`)
    }
    if (!level) return false

    level.useTransaction(trx)
    await level
      .merge({
        available: level.available - line.quantity,
        committed: level.committed + line.quantity,
      })
      .save()
    return inStock
  }

  /** Quantity added (positive) or removed (negative) per variant. */
  protected quantityChanges(
    previous: { productVariantId: string | null; quantity: number }[],
    next: { productVariantId: string | null; quantity: number }[]
  ): Map<string, number> {
    const changes = new Map<string, number>()
    const add = (variantId: string | null, quantity: number) => {
      if (!variantId) return
      changes.set(variantId, (changes.get(variantId) ?? 0) + quantity)
    }
    previous.forEach((line) => add(line.productVariantId, -line.quantity))
    next.forEach((line) => add(line.productVariantId, line.quantity))
    for (const [variantId, change] of changes) if (change === 0) changes.delete(variantId)
    return changes
  }

  /**
   * Applies quantity changes of tracked variants at the location: one
   * locking read and one `UPDATE ... CASE` for all levels.
   */
  protected async moveStock(
    changes: Map<string, number>,
    locationId: string | null,
    trx: TransactionClientContract
  ) {
    if (changes.size === 0) return
    const tracked = await ProductVariant.query({ client: trx })
      .select('id', 'product_id')
      .whereIn('id', [...changes.keys()])
      .where('track_inventory', true)
      .preload('product', (query) => query.select('id', 'title'))
    if (tracked.length === 0) return

    const levels = locationId
      ? await InventoryLevel.query({ client: trx })
          .whereIn(
            'product_variant_id',
            tracked.map(({ id }) => id)
          )
          .where('location_id', locationId)
          .forUpdate()
      : []
    const levelsByVariant = new Map(levels.map((level) => [level.productVariantId, level]))

    const updates: { id: string; change: number }[] = []
    for (const variant of tracked) {
      const change = changes.get(variant.id)!
      const level = levelsByVariant.get(variant.id)
      const available = level?.available ?? 0
      if (change > 0 && (!level || available < change)) {
        fieldError(
          'lineItems',
          `Only ${Math.max(available, 0)} more in stock for ${variant.product.title}`
        )
      }
      if (level) updates.push({ id: level.id, change })
    }
    if (updates.length === 0) return

    const caseSql = `CASE id ${updates.map(() => 'WHEN ? THEN ?::integer').join(' ')} END`
    const caseBindings = updates.flatMap(({ id, change }) => [id, change])
    await InventoryLevel.query({ client: trx })
      .whereIn(
        'id',
        updates.map(({ id }) => id)
      )
      .update({
        available: trx.raw(`available - ${caseSql}`, caseBindings),
        committed: trx.raw(`committed + ${caseSql}`, caseBindings),
        updated_at: new Date(),
      })
  }

  protected async lockNumbers(trx: TransactionClientContract) {
    await trx.rawQuery('SELECT pg_advisory_xact_lock(?)', [NUMBER_LOCK_KEY])
  }

  protected async maxNumber(
    column: 'draft_number' | 'order_number',
    trx: TransactionClientContract
  ) {
    const row = await trx.from('orders').max(`${column} as max`).first()
    return Number(row?.max ?? 0)
  }

  protected async writeLines(
    orderId: string,
    lines: (OrderLineData | PlacedOrderLineData)[],
    trx: TransactionClientContract
  ) {
    if (lines.length === 0) return
    await OrderLineItem.createMany(
      lines.map((line, position) => ({ ...line, orderId, position })),
      { client: trx }
    )
  }
}
