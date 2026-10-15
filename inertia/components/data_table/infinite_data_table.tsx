import { FormButton } from '~/components/form'
import DataTable, { type DataTableProps } from './data_table'
import DataTableLoadMore from './data_table_load_more'
import type { DataTableStatus, InfiniteListState } from './types'

type InfiniteDataTableProps<T, SortKey extends string> = Omit<
  DataTableProps<T, SortKey>,
  'rows' | 'status' | 'errorSlot'
> & {
  list: InfiniteListState<T>
  /** Shown with a retry button when the first batch fails, e.g. "Could not load products." */
  errorMessage: string
}

/**
 * `DataTable` fed by a batch-loaded list: renders the loaded rows, the
 * loading and error states, and a footer that loads the next batch as it
 * scrolls into view.
 */
export default function InfiniteDataTable<T, SortKey extends string = string>({
  list,
  errorMessage,
  skeletonRows = 10,
  ...props
}: InfiniteDataTableProps<T, SortKey>) {
  const status: DataTableStatus = list.isLoading
    ? 'loading'
    : list.isError && list.rows.length === 0
      ? 'error'
      : 'ready'

  return (
    <>
      <DataTable
        {...props}
        rows={list.rows}
        status={status}
        skeletonRows={skeletonRows}
        errorSlot={
          <div className="flex flex-col items-center gap-3">
            <span>{errorMessage}</span>
            <FormButton type="button" variant="secondary" size="sm" onClick={() => list.refetch()}>
              Try again
            </FormButton>
          </div>
        }
      />
      <DataTableLoadMore
        loaded={list.rows.length}
        total={list.total}
        hasMore={list.hasNextPage}
        isLoadingMore={list.isFetchingNextPage}
        isError={list.isFetchNextPageError}
        onLoadMore={list.fetchNextPage}
      />
    </>
  )
}
