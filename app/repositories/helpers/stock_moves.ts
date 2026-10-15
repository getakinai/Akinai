import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import InventoryLevel from '#models/inventory_level'
import ProductVariant from '#models/product_variant'

/** Change to one variant's stock at one location; negative values subtract. */
export type StockMove = {
  variantId: string
  locationId: string
  available: number
  committed: number
}

/**
 * Applies stock moves of tracked variants in one locking read and one
 * `UPDATE ... CASE` statement. Values never drop below 0. A level that
 * doesn't exist yet is created when units are added to `available`
 * (restocking at a location that never held the variant).
 */
export async function applyStockMoves(trx: TransactionClientContract, moves: StockMove[]) {
  const merged = new Map<string, StockMove>()
  for (const move of moves) {
    const key = `${move.variantId}:${move.locationId}`
    const current = merged.get(key)
    merged.set(
      key,
      current
        ? {
            ...current,
            available: current.available + move.available,
            committed: current.committed + move.committed,
          }
        : { ...move }
    )
  }
  const pending = [...merged.values()].filter(
    (move) => move.available !== 0 || move.committed !== 0
  )
  if (pending.length === 0) return

  const tracked = await ProductVariant.query({ client: trx })
    .select('id')
    .whereIn('id', [...new Set(pending.map((move) => move.variantId))])
    .where('track_inventory', true)
  const trackedIds = new Set(tracked.map(({ id }) => id))
  const trackedMoves = pending.filter((move) => trackedIds.has(move.variantId))
  if (trackedMoves.length === 0) return

  const levels = await InventoryLevel.query({ client: trx })
    .select('id', 'product_variant_id', 'location_id')
    .whereIn('product_variant_id', [...new Set(trackedMoves.map((move) => move.variantId))])
    .whereIn('location_id', [...new Set(trackedMoves.map((move) => move.locationId))])
    .forUpdate()
  const levelIds = new Map(
    levels.map((level) => [`${level.productVariantId}:${level.locationId}`, level.id])
  )

  const updates: { id: string; available: number; committed: number }[] = []
  const creates: StockMove[] = []
  for (const move of trackedMoves) {
    const id = levelIds.get(`${move.variantId}:${move.locationId}`)
    if (id) updates.push({ id, available: move.available, committed: move.committed })
    else if (move.available > 0) creates.push(move)
  }

  if (updates.length > 0) {
    const caseFor = (column: 'available' | 'committed') => ({
      sql: `GREATEST(${column} + CASE id ${updates.map(() => 'WHEN ? THEN ?::integer').join(' ')} END, 0)`,
      bindings: updates.flatMap((update) => [update.id, update[column]]),
    })
    const available = caseFor('available')
    const committed = caseFor('committed')
    await trx
      .from('inventory_levels')
      .whereIn(
        'id',
        updates.map(({ id }) => id)
      )
      .update({
        available: trx.raw(available.sql, available.bindings),
        committed: trx.raw(committed.sql, committed.bindings),
        updated_at: new Date(),
      })
  }

  if (creates.length > 0) {
    await InventoryLevel.createMany(
      creates.map((move) => ({
        productVariantId: move.variantId,
        locationId: move.locationId,
        available: move.available,
        committed: 0,
        incoming: 0,
      })),
      { client: trx }
    )
  }
}
