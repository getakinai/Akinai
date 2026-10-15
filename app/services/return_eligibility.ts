import type { DateTime } from 'luxon'

export type EligibilityLine = {
  id: string
  productTitle: string
  variantTitle: string | null
  fulfilledQuantity: number
  refundedQuantity: number
  removedQuantity: number
}

export type EligibilityData = {
  /** Latest successful shipment per order line item id. */
  lastShippedAt: Map<string, DateTime>
  /** Units in returns that weren't declined or cancelled, per line. */
  returned: Map<string, number>
  /** Units refunded through a return (already counted in `returned`), per line. */
  refundedByReturns: Map<string, number>
}

export type ReturnableLine = {
  lineItemId: string
  productTitle: string
  variantTitle: string | null
  /** Units that can still be returned. */
  quantity: number
  /** End of the customer's return window for this line; null for staff. */
  windowEndsAt: DateTime | null
}

/**
 * Units of a line that can still be returned: what shipped, minus units in
 * open or completed returns, minus shipped units refunded outside a return.
 */
export function returnableQuantity(line: EligibilityLine, data: EligibilityData): number {
  const shippedRefunded = Math.max(line.refundedQuantity - line.removedQuantity, 0)
  const refundedOutsideReturns = Math.max(
    shippedRefunded - (data.refundedByReturns.get(line.id) ?? 0),
    0
  )
  return Math.max(
    line.fulfilledQuantity - (data.returned.get(line.id) ?? 0) - refundedOutsideReturns,
    0
  )
}

/**
 * Lines that can be returned. With `windowDays` (customer requests), a line
 * is only returnable within that many days of its latest shipment, and 0
 * days turns customer returns off. Staff pass `null` for no window.
 */
export function returnableLines(
  lines: EligibilityLine[],
  data: EligibilityData,
  { windowDays, now }: { windowDays: number | null; now: DateTime }
): ReturnableLine[] {
  if (windowDays !== null && windowDays <= 0) return []
  return lines.flatMap((line) => {
    const quantity = returnableQuantity(line, data)
    if (quantity <= 0) return []
    const shippedAt = data.lastShippedAt.get(line.id)
    const windowEndsAt =
      windowDays !== null && shippedAt ? shippedAt.plus({ days: windowDays }) : null
    if (windowDays !== null && (!windowEndsAt || windowEndsAt < now)) return []
    return [
      {
        lineItemId: line.id,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        quantity,
        windowEndsAt,
      },
    ]
  })
}

/** When the customer's last chance to return something from the order ends. */
export function returnWindowEndsAt(data: EligibilityData, windowDays: number): DateTime | null {
  if (windowDays <= 0) return null
  let latest: DateTime | null = null
  for (const shippedAt of data.lastShippedAt.values()) {
    if (!latest || shippedAt > latest) latest = shippedAt
  }
  return latest ? latest.plus({ days: windowDays }) : null
}
