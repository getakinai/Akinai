import type Order from '#models/order'

/**
 * The order's fulfillments with their shipped lines titled from the order
 * line items. Empty unless `fulfillments.lines` and `lineItems` are
 * preloaded.
 */
export function orderFulfillments(order: Order, { successfulOnly = false } = {}) {
  if (!('fulfillments' in order.$preloaded)) return []
  const linesById = new Map(order.lineItems.map((line) => [line.id, line]))

  return order.fulfillments
    .filter((fulfillment) => !successfulOnly || !fulfillment.isCancelled)
    .map((fulfillment) => ({
      id: fulfillment.id,
      number: fulfillment.number,
      status: fulfillment.status,
      trackingCompany: fulfillment.trackingCompany,
      trackingNumber: fulfillment.trackingNumber,
      trackingUrl: fulfillment.trackingUrl,
      cancelledAt: fulfillment.cancelledAt?.toISO() ?? null,
      createdAt: fulfillment.createdAt.toISO(),
      lines: fulfillment.lines.map((shipped) => {
        const line = linesById.get(shipped.orderLineItemId)
        return {
          lineItemId: shipped.orderLineItemId,
          productTitle: line?.productTitle ?? '',
          variantTitle: line?.variantTitle ?? null,
          quantity: shipped.quantity,
        }
      }),
    }))
}
