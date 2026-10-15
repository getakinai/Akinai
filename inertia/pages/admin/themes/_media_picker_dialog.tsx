import { useState } from 'react'
import { FormButton } from '~/components/form'
import { Dialog, SearchInput } from '~/components/ui'
import { useAdminMediaInfinite } from '../media/_hooks'
import type { AdminMedia } from '../media/_types'
import { cn } from '~/lib/styles'

export function MediaPickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (key: string, url: string) => void
}) {
  const [q, setQ] = useState('')
  const list = useAdminMediaInfinite({ q, folder: '' })

  function choose(media: AdminMedia) {
    onPick(media.key, media.url)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Choose an image" className="max-w-3xl">
      <div className="flex flex-col gap-4">
        <SearchInput
          label="Search media"
          value={q}
          onDebouncedChange={setQ}
          placeholder="Search media…"
        />
        <ul className="grid max-h-[420px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
          {list.rows.map((media) => (
            <li key={media.id}>
              <button
                type="button"
                className={cn(
                  'block w-full overflow-hidden rounded-lg border border-line bg-paper',
                  'hover:ring-2 hover:ring-accent'
                )}
                onClick={() => choose(media)}
              >
                <img src={media.url} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
        {list.hasNextPage && (
          <FormButton
            type="button"
            variant="secondary"
            loading={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            Load more
          </FormButton>
        )}
      </div>
    </Dialog>
  )
}
