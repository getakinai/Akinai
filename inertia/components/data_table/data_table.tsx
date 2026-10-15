import { type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import Checkbox from '~/components/ui/checkbox'
import Skeleton from '~/components/ui/skeleton'
import { cn, dataTable } from '~/lib/styles'
import type { DataTableColumn, DataTableStatus, SortState } from './types'

export type DataTableProps<T, SortKey extends string> = {
  rows: T[]
  columns: DataTableColumn<T, SortKey>[]
  getRowId: (row: T) => string
  label: string
  sort?: SortState<SortKey>
  onSortChange?: (sort: SortState<SortKey>) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  rowActions?: (row: T) => ReactNode
  status?: DataTableStatus
  errorSlot?: ReactNode
  emptySlot?: ReactNode
  skeletonRows?: number
}

/**
 * Presentation-only table. It renders the rows it is given, in the order it
 * is given them, and reports sort and selection changes through callbacks.
 * Fetching, sorting, filtering and pagination are owned by the caller.
 */
export default function DataTable<T, SortKey extends string = string>({
  rows,
  columns,
  getRowId,
  label,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  rowActions,
  status = 'ready',
  errorSlot = 'Could not load data.',
  emptySlot = 'Nothing to show yet.',
  skeletonRows = 8,
}: DataTableProps<T, SortKey>) {
  const selectable = Boolean(selectedIds && onSelectionChange)
  const selected = new Set(selectedIds)
  const rowIds = rows.map(getRowId)
  const selectedOnPage = rowIds.filter((id) => selected.has(id)).length
  const allSelected = rowIds.length > 0 && selectedOnPage === rowIds.length
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)

  function toggleAll() {
    if (!onSelectionChange) return
    const others = (selectedIds ?? []).filter((id) => !rowIds.includes(id))
    onSelectionChange(allSelected ? others : [...others, ...rowIds])
  }

  function toggleRow(id: string) {
    if (!onSelectionChange) return
    const current = selectedIds ?? []
    onSelectionChange(current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }

  function toggleSort(sortKey: SortKey) {
    if (!onSortChange) return
    const direction = sort?.key === sortKey && sort.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ key: sortKey, direction })
  }

  return (
    <div className="min-w-0 max-w-full">
      <div className={dataTable.scroller}>
        <table className={dataTable.table} aria-label={label} aria-busy={status === 'loading'}>
          <thead>
            <tr>
              {selectable && (
                <th className={cn(dataTable.th, 'w-12')}>
                  <Checkbox
                    aria-label="Select all loaded rows"
                    checked={allSelected}
                    indeterminate={selectedOnPage > 0 && !allSelected}
                    disabled={rows.length === 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => {
                const sortable = Boolean(column.sortKey && onSortChange)
                const active = sortable && sort?.key === column.sortKey
                const SortIcon = !active
                  ? ChevronsUpDown
                  : sort?.direction === 'asc'
                    ? ArrowUp
                    : ArrowDown

                return (
                  <th
                    key={column.key}
                    className={cn(dataTable.th, column.align === 'right' && 'text-right')}
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {sortable && column.sortKey ? (
                      <button
                        type="button"
                        className={cn(dataTable.sortButton, active && 'text-ink')}
                        onClick={() => toggleSort(column.sortKey as SortKey)}
                      >
                        {column.header}
                        <SortIcon size={12} aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
              {rowActions && (
                <th className={cn(dataTable.th, 'w-px')}>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {status === 'loading' &&
              Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={`skeleton-${index}`}>
                  {Array.from({ length: colSpan }, (__, cellIndex) => (
                    <td key={cellIndex} className={dataTable.td}>
                      <Skeleton className={cellIndex === 0 && selectable ? 'w-4' : 'w-3/4'} />
                    </td>
                  ))}
                </tr>
              ))}

            {status === 'error' && (
              <tr>
                <td colSpan={colSpan} className={dataTable.message}>
                  {errorSlot}
                </td>
              </tr>
            )}

            {status === 'ready' && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className={dataTable.message}>
                  {emptySlot}
                </td>
              </tr>
            )}

            {status === 'ready' &&
              rows.map((row) => {
                const id = getRowId(row)
                const isSelected = selected.has(id)

                return (
                  <tr
                    key={id}
                    className={cn(dataTable.row, isSelected && dataTable.rowSelected)}
                    aria-selected={selectable ? isSelected : undefined}
                  >
                    {selectable && (
                      <td className={dataTable.td}>
                        <Checkbox
                          aria-label="Select row"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(dataTable.td, column.align === 'right' && 'text-right')}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={dataTable.td}>
                        <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                          {rowActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
