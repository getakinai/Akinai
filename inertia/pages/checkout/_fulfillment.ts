import { type BadgeTone } from '~/lib/styles'
import { type OrderFulfillmentStatus } from './_types'

/**
 * What the shopper sees for the order's fulfillment. In progress and on
 * hold both read as "Processing" so internal holds aren't exposed; nothing
 * shows while the order is unfulfilled.
 */
export function customerFulfillmentMeta(
  status: OrderFulfillmentStatus
): { label: string; tone: BadgeTone } | null {
  switch (status) {
    case 'in_progress':
    case 'on_hold':
      return { label: 'Processing', tone: 'info' }
    case 'partially_fulfilled':
      return { label: 'Partially shipped', tone: 'info' }
    case 'fulfilled':
      return { label: 'Shipped', tone: 'success' }
    default:
      return null
  }
}
