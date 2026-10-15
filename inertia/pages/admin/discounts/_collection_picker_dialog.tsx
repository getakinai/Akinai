import { useState } from 'react'
import { useAdminCollections } from '../collections/_hooks'
import PickerDialog from './_picker_dialog'
import { MAX_DISCOUNT_COLLECTIONS, type DiscountTargetItem } from './_types'

type CollectionPickerDialogProps = {
  open: boolean
  onClose: () => void
  selected: DiscountTargetItem[]
  onDone: (items: DiscountTargetItem[]) => void
}

const SEARCH_PAGE_SIZE = 25

/** Pick the collections a discount applies to. Archived collections are hidden. */
export default function CollectionPickerDialog(props: CollectionPickerDialogProps) {
  const [q, setQ] = useState('')
  const { data, isLoading, isError } = useAdminCollections({
    q,
    status: '',
    type: '',
    sort: 'title',
    direction: 'asc',
    page: 1,
    perPage: SEARCH_PAGE_SIZE,
  })

  const rows = (data?.data ?? [])
    .filter((collection) => collection.status !== 'archived')
    .map((collection) => ({
      id: collection.id,
      title: collection.title,
      detail: collection.type === 'manual' ? 'Manual collection' : 'Automated collection',
    }))

  return (
    <PickerDialog
      {...props}
      title="Choose collections"
      noun={['collection', 'collections']}
      max={MAX_DISCOUNT_COLLECTIONS}
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      search={q}
      onSearch={setQ}
    />
  )
}
