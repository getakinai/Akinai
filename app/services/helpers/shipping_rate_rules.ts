/** What a cart looks like to shipping: amounts in the market's currency. */
export type CartShippingMetrics = {
  subtotal: number
  /** In the store's weight unit; variants without a weight count as 0. */
  weight: number
  itemCount: number
  /** Every item's product is marked "ships free". */
  allShipFree: boolean
}

export type SubtotalBounds = {
  minSubtotal: number | null
  maxSubtotal: number | null
}

export type ShippingRateConditions = SubtotalBounds & {
  minWeight: number | null
  maxWeight: number | null
  minItems: number | null
  maxItems: number | null
}

const within = (value: number, min: number | null, max: number | null) =>
  (min === null || value >= min) && (max === null || value <= max)

/**
 * Whether the cart meets every condition set on the rate. `bounds` are the
 * subtotal bounds of the market being priced (the rate's own in the primary
 * market). Empty bounds mean no limit.
 */
export function rateMatches(
  rate: ShippingRateConditions,
  cart: CartShippingMetrics,
  bounds: SubtotalBounds
): boolean {
  return (
    within(cart.subtotal, bounds.minSubtotal, bounds.maxSubtotal) &&
    within(cart.weight, rate.minWeight, rate.maxWeight) &&
    within(cart.itemCount, rate.minItems, rate.maxItems)
  )
}

/**
 * When every item ships free, the cheapest rate costs 0 and faster rates
 * keep their price. Mutates and returns `rates`, which must be sorted
 * cheapest first.
 */
export function applyFreeShippingProducts<T extends { price: number }>(
  rates: T[],
  cart: CartShippingMetrics
): T[] {
  if (cart.allShipFree && rates.length > 0) rates[0].price = 0
  return rates
}
