import { keepPreviousData, useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import {
  ADMIN_LIST_PAGE_SIZE,
  flattenPages,
  nextPageParam,
  type PaginatedPage,
} from '~/lib/infinite_list'

/**
 * A back-office list loaded `ADMIN_LIST_PAGE_SIZE` rows at a time. A new
 * `queryKey` (search, sort or filter change) starts again from the first
 * batch. Returns the TanStack query plus the flattened `rows` and `total`.
 */
export function useAdminInfiniteList<TItem>(
  queryKey: QueryKey,
  fetchPage: (page: { page: number; perPage: number }) => Promise<PaginatedPage<TItem>>
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage({ page: pageParam, perPage: ADMIN_LIST_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    placeholderData: keepPreviousData,
  })
  return { ...query, ...flattenPages(query.data) }
}
