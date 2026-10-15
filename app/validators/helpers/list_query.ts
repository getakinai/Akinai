import vine from '@vinejs/vine'

export const PER_PAGE_OPTIONS = [15, 25, 50, 100]

/**
 * Shared query-string schema for paginated list endpoints. Pass the
 * whitelist of sortable keys exposed by the endpoint.
 */
export function listQuerySchema<SortKey extends string>(sortKeys: readonly SortKey[]) {
  return {
    q: vine.string().trim().maxLength(100).optional(),
    sort: vine.enum(sortKeys).optional(),
    direction: vine.enum(['asc', 'desc'] as const).optional(),
    // Query-string values arrive as text, so numbers/booleans are coerced (bounded below).
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().in(PER_PAGE_OPTIONS).optional(),
  }
}

/**
 * Query-string schema for CSV exports: the list filters without paging.
 */
export function exportQuerySchema<SortKey extends string>(sortKeys: readonly SortKey[]) {
  return {
    q: vine.string().trim().maxLength(100).optional(),
    sort: vine.enum(sortKeys).optional(),
    direction: vine.enum(['asc', 'desc'] as const).optional(),
  }
}
