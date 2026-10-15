import { z } from 'zod'

export const PaginationMetaSchema = z.object({
  total: z.number(),
  perPage: z.number(),
  currentPage: z.number(),
  lastPage: z.number(),
})

/** Matches `MAX_BULK_IDS` in `app/validators/helpers/bulk_ids.ts`. */
export const MAX_BULK_SELECTION = 100

/**
 * Shape of `ctx.serialize(BulkResultTransformer.transform(...))` responses.
 */
export const BulkResultResponseSchema = z.object({
  data: z.object({ updated: z.number(), skipped: z.number() }),
})

export type BulkResult = z.infer<typeof BulkResultResponseSchema>['data']

/**
 * Shape of `ctx.serialize(XTransformer.paginate(...))` responses.
 */
export function paginatedResponse<TItem extends z.ZodType>(item: TItem) {
  return z.object({ data: z.array(item), metadata: PaginationMetaSchema })
}

/** Storefront catalog lists page with opaque `nextCursor` values instead of page numbers. */
export const CursorMetaSchema = z.object({
  total: z.number(),
  nextCursor: z.string().nullable(),
})

export function cursorPaginatedResponse<TItem extends z.ZodType>(item: TItem) {
  return z.object({ data: z.array(item), metadata: CursorMetaSchema })
}

export const CatalogTokenResponseSchema = z.object({
  data: z.object({ token: z.string(), expiresIn: z.number() }),
})
