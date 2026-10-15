import { useState } from 'react'
import { toast } from 'sonner'
import { HttpError } from '~/lib/http'
import { MAX_BULK_SELECTION, type BulkResult } from '~/lib/schemas'

/**
 * Row selection for bulk actions on a list page. Pass `selectedIds` and
 * `setSelectedIds` to `DataTable`, call `clear()` when the search or a
 * filter changes, and pass `feedback(verb)` as the mutation callbacks to
 * toast the outcome and clear the selection on success.
 */
export function useBulkSelection(noun: [string, string]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const tooMany = selectedIds.length > MAX_BULK_SELECTION

  function clear() {
    setSelectedIds([])
  }

  function feedback(verb: string) {
    return {
      onSuccess: ({ updated, skipped }: BulkResult) => {
        const note = skipped > 0 ? ` (${skipped} skipped, already ${verb} or not eligible)` : ''
        toast.success(`${updated} ${updated === 1 ? noun[0] : noun[1]} ${verb}${note}`)
        clear()
      },
      onError: (error: unknown) =>
        toast.error(
          error instanceof HttpError
            ? (Object.values(error.fieldErrors)[0] ?? error.message)
            : 'Something went wrong'
        ),
    }
  }

  return { selectedIds, setSelectedIds, clear, tooMany, feedback, noun }
}
