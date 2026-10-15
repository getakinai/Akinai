import { router } from '@inertiajs/react'
import { ChevronRight, Inbox, Tag, Tags, Truck, type LucideIcon } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { discountTypeMeta } from './_format'
import { DISCOUNT_TYPES, type DiscountType } from './_types'

const icons: Record<DiscountType, LucideIcon> = {
  amount_off_products: Tag,
  buy_x_get_y: Tags,
  amount_off_order: Inbox,
  free_shipping: Truck,
}

type DiscountTypeDialogProps = {
  open: boolean
  onClose: () => void
}

/** "Select discount type": each row opens the create page for that type. */
export default function DiscountTypeDialog({ open, onClose }: DiscountTypeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Select discount type"
      className="w-[min(620px,calc(100vw-2rem))]"
    >
      <ul className="-mx-6 divide-y divide-line border-y border-line">
        {DISCOUNT_TYPES.map((type) => {
          const Icon = icons[type]
          const meta = discountTypeMeta[type]
          return (
            <li key={type}>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-3 px-6 py-3.5 text-left transition-colors duration-150 hover:bg-paper focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => router.visit(`/admin/discounts/create?type=${type}`)}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                    <Icon size={15} className="shrink-0" aria-hidden />
                    {meta.label}
                  </span>
                  <span className="mt-1 block text-[13px] text-pretty text-muted">
                    {meta.description}
                  </span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end">
        <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </FormButton>
      </div>
    </Dialog>
  )
}
