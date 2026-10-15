import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors } from '@vinejs/vine'
import Fulfillment from '#models/fulfillment'
import FulfillmentLineItem from '#models/fulfillment_line_item'
import InventoryLevel from '#models/inventory_level'
import Order, { type OrderFulfillmentStatus } from '#models/order'
import OrderLineItem from '#models/order_line_item'
import ProductVariant from '#models/product_variant'
import { caseIncrement } from '#repositories/helpers/case_increment'

export type FulfillmentTracking = {
  trackingCompany: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}

export type FulfillmentLineInput = { lineItemId: string; quantity: number }

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'fulfillment' }])
}

/**
 * Order status from fulfilled quantities; `fallback` applies when nothing
 * is fulfilled. Refunded units that never shipped (`removedQuantity`) no
 * longer need fulfilling.
 */
export function rollupFulfillment(
  lines: { quantity: number; fulfilledQuantity: number; removedQuantity: number }[],
  fallback: OrderFulfillmentStatus
): OrderFulfillmentStatus {
  const fulfilled = lines.reduce((sum, line) => sum + line.fulfilledQuantity, 0)
  if (fulfilled === 0) return fallback
  return lines.every((line) => line.fulfilledQuantity + line.removedQuantity >= line.quantity)
    ? 'fulfilled'
    : 'partially_fulfilled'
}

/** Units of the line still waiting to ship. */
export function unfulfilledQuantity(line: {
  quantity: number
  fulfilledQuantity: number
  removedQuantity: number
}) {
  return Math.max(line.quantity - line.fulfilledQuantity - line.removedQuantity, 0)
}

export default class FulfillmentRepository {
  async findOrFail(id: string): Promise<Fulfillment> {
    return Fulfillment.query().where('id', id).preload('lines').firstOrFail()
  }

  /**
   * Records shipped items: one fulfillment, its lines, the line items'
   * fulfilled quantities, the committed stock of tracked variants leaving
   * the location, and the order's rolled-up status. Throws a validation
   * error (and rolls back) when the order is on hold or a quantity exceeds
   * what is left to fulfill.
   */
  async create(
    orderId: string,
    input: FulfillmentLineInput[],
    tracking: FulfillmentTracking,
    locationId: string | null
  ): Promise<Fulfillment> {
    return db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('id', orderId)
        .forUpdate()
        .firstOrFail()
      if (order.status !== 'open') fieldError('order', 'Only open orders can be fulfilled')
      if (order.fulfillmentStatus === 'on_hold') {
        fieldError('order', 'Release the hold before fulfilling this order')
      }

      const lines = await OrderLineItem.query({ client: trx })
        .where('order_id', order.id)
        .forUpdate()
      const linesById = new Map(lines.map((line) => [line.id, line]))
      input.forEach(({ lineItemId, quantity }, index) => {
        const line = linesById.get(lineItemId)
        if (!line) fieldError(`lineItems.${index}.lineItemId`, 'This item is not on the order')
        const remaining = unfulfilledQuantity(line)
        if (quantity > remaining) {
          fieldError(
            `lineItems.${index}.quantity`,
            `Only ${remaining} left to fulfill for ${line.productTitle}`
          )
        }
      })

      const last = await trx
        .from('fulfillments')
        .where('order_id', order.id)
        .max('number as max')
        .first()
      const fulfillment = await Fulfillment.create(
        {
          orderId: order.id,
          number: Number(last?.max ?? 0) + 1,
          status: 'success',
          locationId,
          ...tracking,
          cancelledAt: null,
        },
        { client: trx }
      )
      await FulfillmentLineItem.createMany(
        input.map(({ lineItemId, quantity }) => ({
          fulfillmentId: fulfillment.id,
          orderLineItemId: lineItemId,
          quantity,
        })),
        { client: trx }
      )

      await this.applyQuantities(order, lines, input, 1, locationId, trx)
      await fulfillment.load('lines')
      return fulfillment
    })
  }

  async updateTracking(fulfillment: Fulfillment, tracking: FulfillmentTracking) {
    fulfillment.$skipAudit = true
    return fulfillment.merge(tracking).save()
  }

  /**
   * Returns the fulfillment's quantities to unfulfilled and its stock to
   * committed at its location.
   */
  async cancel(fulfillment: Fulfillment): Promise<Fulfillment> {
    return db.transaction(async (trx) => {
      const locked = await Fulfillment.query({ client: trx })
        .where('id', fulfillment.id)
        .forUpdate()
        .firstOrFail()
      if (locked.isCancelled) fieldError('fulfillment', 'This fulfillment is already cancelled')

      const order = await Order.query({ client: trx })
        .where('id', locked.orderId)
        .forUpdate()
        .firstOrFail()
      const lines = await OrderLineItem.query({ client: trx })
        .where('order_id', order.id)
        .forUpdate()
      const shipped = await FulfillmentLineItem.query({ client: trx }).where(
        'fulfillment_id',
        locked.id
      )

      await this.applyQuantities(
        order,
        lines,
        shipped.map((line) => ({ lineItemId: line.orderLineItemId, quantity: line.quantity })),
        -1,
        locked.locationId,
        trx
      )

      locked.useTransaction(trx)
      locked.$skipAudit = true
      await locked.merge({ status: 'cancelled', cancelledAt: DateTime.now() }).save()
      await locked.load('lines')
      return locked
    })
  }

  /**
   * Moves `input` quantities into (`direction` 1) or out of (-1)
   * fulfillment: line items' fulfilled quantities, committed stock of
   * tracked variants, and the order's rolled-up status.
   */
  protected async applyQuantities(
    order: Order,
    lines: OrderLineItem[],
    input: FulfillmentLineInput[],
    direction: 1 | -1,
    locationId: string | null,
    trx: TransactionClientContract
  ) {
    const linesById = new Map(lines.map((line) => [line.id, line]))
    const byLine = new Map<string, number>()
    for (const { lineItemId, quantity } of input) {
      byLine.set(lineItemId, (byLine.get(lineItemId) ?? 0) + quantity * direction)
    }

    await caseIncrement(
      trx,
      'order_line_items',
      'fulfilled_quantity',
      [...byLine].map(([id, change]) => ({ id, change })),
      { floorAtZero: true }
    )

    const byVariant = new Map<string, number>()
    for (const [lineId, change] of byLine) {
      const variantId = linesById.get(lineId)?.productVariantId
      if (variantId) byVariant.set(variantId, (byVariant.get(variantId) ?? 0) + change)
    }
    if (locationId && byVariant.size > 0) {
      const tracked = await ProductVariant.query({ client: trx })
        .select('id')
        .whereIn('id', [...byVariant.keys()])
        .where('track_inventory', true)
      const levels = tracked.length
        ? await InventoryLevel.query({ client: trx })
            .select('id', 'product_variant_id')
            .whereIn(
              'product_variant_id',
              tracked.map(({ id }) => id)
            )
            .where('location_id', locationId)
            .forUpdate()
        : []
      await caseIncrement(
        trx,
        'inventory_levels',
        'committed',
        levels.map((level) => ({ id: level.id, change: -byVariant.get(level.productVariantId)! })),
        { floorAtZero: true }
      )
    }

    const next = lines.map((line) => ({
      quantity: line.quantity,
      fulfilledQuantity: Math.max(line.fulfilledQuantity + (byLine.get(line.id) ?? 0), 0),
      removedQuantity: line.removedQuantity,
    }))
    const fallback = order.hasFulfilledItems ? 'unfulfilled' : order.fulfillmentStatus
    order.useTransaction(trx)
    order.$skipAudit = true
    order.fulfillmentStatus = rollupFulfillment(next, fallback)
    await order.save()
  }
}
