import { useCallback, useState } from 'react'
import type { SortState } from '~/components/data_table/types'

export type ListQuery<SortKey extends string> = {
  q: string
  sort: SortKey
  direction: 'asc' | 'desc'
}

type Options<SortKey extends string> = {
  defaultSort: SortState<SortKey>
}

/**
 * Client state for a back-office list: search and sort. Rows are loaded in
 * batches by `useAdminInfiniteList`, which restarts when this state changes.
 */
export function useListQueryState<SortKey extends string>({ defaultSort }: Options<SortKey>) {
  const [query, setQuery] = useState<ListQuery<SortKey>>({
    q: '',
    sort: defaultSort.key,
    direction: defaultSort.direction,
  })

  const setSearch = useCallback((q: string) => setQuery((prev) => ({ ...prev, q })), [])

  const setSort = useCallback(
    ({ key, direction }: SortState<SortKey>) =>
      setQuery((prev) => ({ ...prev, sort: key, direction })),
    []
  )

  const sort: SortState<SortKey> = { key: query.sort, direction: query.direction }

  return { query, sort, setSearch, setSort }
}
