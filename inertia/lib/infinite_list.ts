import type { InfiniteData } from '@tanstack/react-query'
import type { PaginationMeta } from '~/components/data_table'

/** Rows fetched per batch on back-office list pages. */
export const ADMIN_LIST_PAGE_SIZE = 25

export type PaginatedPage<TItem> = { data: TItem[]; metadata: PaginationMeta }

/** `getNextPageParam` for `{ data, metadata }` list responses. */
export function nextPageParam({ metadata }: { metadata: PaginationMeta }) {
  return metadata.currentPage < metadata.lastPage ? metadata.currentPage + 1 : undefined
}

/** Every loaded row, in order, plus the total the server reports. */
export function flattenPages<TItem>(data?: InfiniteData<PaginatedPage<TItem>>) {
  return {
    rows: data?.pages.flatMap((page) => page.data) ?? [],
    total: data?.pages.at(-1)?.metadata.total ?? 0,
  }
}
