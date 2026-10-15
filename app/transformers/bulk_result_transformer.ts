import { BaseTransformer } from '@adonisjs/core/transformers'

export type BulkResult = { updated: number; skipped: number }

export function bulkResult(ids: string[], changed: unknown[]): BulkResult {
  return { updated: changed.length, skipped: ids.length - changed.length }
}

/**
 * Outcome of a bulk action: records changed, and records left alone because
 * they were already in the requested state or not eligible.
 */
export default class BulkResultTransformer extends BaseTransformer<BulkResult> {
  toObject() {
    return { updated: this.resource.updated, skipped: this.resource.skipped }
  }
}
