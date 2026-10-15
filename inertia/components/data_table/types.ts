import { type ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export type SortState<SortKey extends string = string> = {
  key: SortKey
  direction: SortDirection
}

export type DataTableColumn<T, SortKey extends string = string> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortKey?: SortKey
  width?: string
  align?: 'left' | 'right'
}

export type DataTableStatus = 'loading' | 'error' | 'ready'

/**
 * A list loaded in batches, as returned by `useAdminInfiniteList` (any
 * object with this shape works).
 */
export type InfiniteListState<T> = {
  rows: T[]
  total: number
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => unknown
  refetch: () => unknown
}

export type PaginationMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}
