import db from '@adonisjs/lucid/services/db'
import type { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder'

/**
 * Tables holding records a customer owns through `customer_id`, with any
 * extra scope (e.g. staff draft orders are never the customer's).
 */
const OWNED_RESOURCES = {
  address: { table: 'customer_addresses', scope: null },
  order: {
    table: 'orders',
    scope: (query: DatabaseQueryBuilderContract) => query.whereNot('status', 'draft'),
  },
  support_ticket: { table: 'support_tickets', scope: null },
} satisfies Record<
  string,
  { table: string; scope: ((query: DatabaseQueryBuilderContract) => unknown) | null }
>

export type CustomerOwnedResource = keyof typeof OWNED_RESOURCES

export default class CustomerOwnershipRepository {
  async owns(resource: CustomerOwnedResource, customerId: string, id: string): Promise<boolean> {
    const { table, scope } = OWNED_RESOURCES[resource]
    const query = db.from(table).select('id').where('id', id).where('customer_id', customerId)
    if (scope) scope(query)
    return (await query.first()) !== null
  }
}
