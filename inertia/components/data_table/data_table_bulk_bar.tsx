import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { MAX_BULK_SELECTION } from '~/lib/schemas'
import { cn } from '~/lib/styles'

type DataTableBulkBarProps = {
  selectedCount: number
  onClear: () => void
  /** Bulk action buttons for the selected rows. */
  children: ReactNode
  /** Singular and plural record names, e.g. `['collection', 'collections']`. */
  noun?: [string, string]
  className?: string
}

/**
 * Bar shown above a `DataTable` while rows are selected. Shows how many
 * rows are selected, a clear button and the caller's bulk actions. Renders
 * nothing when the selection is empty.
 */
export default function DataTableBulkBar({
  selectedCount,
  onClear,
  children,
  noun = ['item', 'items'],
  className,
}: DataTableBulkBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-lg border border-accent/20 bg-accent-soft px-3 py-2 motion-safe:animate-chunk-rise',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          title="Clear selection"
          className="grid size-7 shrink-0 place-items-center rounded-md text-accent transition-colors duration-150 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <X size={15} />
        </button>
        <span className="text-[13.5px] font-medium text-ink" aria-live="polite">
          {selectedCount} {selectedCount === 1 ? noun[0] : noun[1]} selected
        </span>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end max-[480px]:[&>*]:flex-1">
        {selectedCount > MAX_BULK_SELECTION && (
          <span className="text-[12.5px] text-muted">
            Select up to {MAX_BULK_SELECTION} at a time
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
