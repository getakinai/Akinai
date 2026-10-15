import { useState } from 'react'
import { formatPriceRange, productStatusMeta } from '../products/_format'
import { useAdminProducts } from '../products/_hooks'
import PickerDialog from './_picker_dialog'
import { MAX_DISCOUNT_PRODUCTS, type DiscountTargetItem } from './_types'

type ProductPickerDialogProps = {
  open: boolean
  onClose: () => void
  selected: DiscountTargetItem[]
  onDone: (items: DiscountTargetItem[]) => void
}

const SEARCH_PAGE_SIZE = 25

/** Pick the products a discount applies to. Archived products are hidden. */
export default function ProductPickerDialog(props: ProductPickerDialogProps) {
  const [q, setQ] = useState('')
  const { data, isLoading, isError } = useAdminProducts({
    q,
    status: '',
    sort: 'title',
    direction: 'asc',
    page: 1,
    perPage: SEARCH_PAGE_SIZE,
  })

  const rows = (data?.data ?? [])
    .filter((product) => product.status !== 'archived')
    .map((product) => ({
      id: product.id,
      title: product.title,
      detail: `${productStatusMeta[product.status].label} · ${formatPriceRange(
        product.priceMin,
        product.priceMax
      )}`,
    }))

  return (
    <PickerDialog
      {...props}
      title="Choose products"
      noun={['product', 'products']}
      max={MAX_DISCOUNT_PRODUCTS}
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      search={q}
      onSearch={setQ}
    />
  )
}
