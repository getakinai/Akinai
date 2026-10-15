import { useState } from 'react'
import { FormButton } from '~/components/form'
import { Checkbox, Dialog, SearchInput } from '~/components/ui'
import { cn } from '~/lib/styles'
import { type DiscountTargetItem } from './_types'

export type PickerRow = DiscountTargetItem & { detail: string }

type PickerDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  noun: [string, string]
  /** Already chosen; ticked when the dialog opens. */
  selected: DiscountTargetItem[]
  max: number
  rows: PickerRow[]
  isLoading: boolean
  isError: boolean
  search: string
  onSearch: (q: string) => void
  onDone: (items: DiscountTargetItem[]) => void
}

/**
 * Search list with checkboxes for picking discount targets. Items ticked
 * earlier stay ticked even when the search hides them.
 */
export default function PickerDialog({
  open,
  onClose,
  title,
  noun,
  selected,
  max,
  rows,
  isLoading,
  isError,
  search,
  onSearch,
  onDone,
}: PickerDialogProps) {
  const [picked, setPicked] = useState<DiscountTargetItem[]>(selected)
  const pickedIds = new Set(picked.map(({ id }) => id))
  const tooMany = picked.length > max

  function toggle(row: PickerRow) {
    setPicked((current) =>
      current.some(({ id }) => id === row.id)
        ? current.filter(({ id }) => id !== row.id)
        : [...current, { id: row.id, title: row.title }]
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={`Search, then tick the ${noun[1]} this discount uses.`}
      className="w-[min(560px,calc(100vw-2rem))]"
    >
      <SearchInput
        label={`Search ${noun[1]}`}
        placeholder={`Search ${noun[1]}…`}
        value={search}
        onDebouncedChange={onSearch}
        autoFocus
      />
      <div className="max-h-[50vh] min-h-[160px] overflow-y-auto rounded-lg border border-line">
        {isLoading ? (
          <p className="p-4 text-[13px] text-muted">Loading {noun[1]}…</p>
        ) : isError ? (
          <p className="p-4 text-[13px] text-danger">Could not load {noun[1]}.</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-[13px] text-muted">No {noun[1]} match your search.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const checked = pickedIds.has(row.id)
              return (
                <li key={row.id}>
                  <label
                    className={cn(
                      'flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-paper',
                      checked && 'bg-accent-soft/50'
                    )}
                  >
                    <Checkbox checked={checked} onChange={() => toggle(row)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-ink">{row.title}</span>
                      <span className="block truncate font-mono text-[11.5px] text-muted">
                        {row.detail}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn('text-[13px]', tooMany ? 'text-danger' : 'text-muted')}>
          {tooMany ? `Choose at most ${max} ${noun[1]}` : `${picked.length} selected`}
        </span>
        <div className="flex flex-wrap gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton type="button" size="sm" disabled={tooMany} onClick={() => onDone(picked)}>
            Done
          </FormButton>
        </div>
      </div>
    </Dialog>
  )
}
