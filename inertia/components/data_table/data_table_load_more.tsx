import { useEffect, useRef } from 'react'
import { FormButton } from '~/components/form'

type DataTableLoadMoreProps = {
  /** Rows currently rendered. */
  loaded: number
  /** Rows matching the current search and filters. */
  total: number
  hasMore: boolean
  isLoadingMore: boolean
  /** The last batch failed to load. */
  isError?: boolean
  onLoadMore: () => void
}

/**
 * Footer for an infinitely loaded `DataTable`. Loads the next batch when it
 * scrolls into view, shows how many rows are loaded, and keeps a button for
 * keyboard users and for retrying a failed batch.
 */
export default function DataTableLoadMore({
  loaded,
  total,
  hasMore,
  isLoadingMore,
  isError = false,
  onLoadMore,
}: DataTableLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const canAutoLoad = hasMore && !isLoadingMore && !isError

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !canAutoLoad) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
      },
      { rootMargin: '300px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [canAutoLoad, onLoadMore])

  if (!hasMore) return null

  return (
    <div
      ref={sentinelRef}
      className="mt-4 flex flex-col items-center gap-3 text-center text-[13px] text-muted"
    >
      <span aria-live="polite">
        Showing <strong className="font-medium text-ink">{loaded}</strong> of{' '}
        <strong className="font-medium text-ink">{total}</strong>
      </span>
      {isError && <span className="text-danger">Could not load more rows.</span>}
      <FormButton
        type="button"
        variant="secondary"
        size="sm"
        loading={isLoadingMore}
        loadingText="Loading…"
        onClick={onLoadMore}
      >
        {isError ? 'Try again' : 'Load more'}
      </FormButton>
    </div>
  )
}
