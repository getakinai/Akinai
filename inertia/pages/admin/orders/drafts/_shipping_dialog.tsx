import { useState } from 'react'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { cn } from '~/lib/styles'
import { formatMoney } from '../_format'

type ShippingRate = { id: string; name: string; price: number }

type ShippingDialogProps = {
  open: boolean
  onClose: () => void
  rates: ShippingRate[]
  hasAddress: boolean
  currencyCode: string
  rateId: string | null
  onApply: (rateId: string | null) => void
}

export default function ShippingDialog({
  open,
  onClose,
  rates,
  hasAddress,
  currencyCode,
  rateId,
  onApply,
}: ShippingDialogProps) {
  const [selected, setSelected] = useState(rateId)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Shipping or delivery"
      description="Rates come from the shipping zone that covers the customer’s address."
      className="w-[min(460px,calc(100vw-24px))]"
    >
      {!hasAddress ? (
        <p className="rounded-lg border border-dashed border-line-2 px-4 py-6 text-center text-[13.5px] text-muted">
          Choose a customer and a shipping address first.
        </p>
      ) : rates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-2 px-4 py-6 text-center text-[13.5px] text-muted">
          No shipping rates cover this address and order subtotal.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Shipping rates" className="flex flex-col gap-2">
          {rates.map((rate) => {
            const checked = selected === rate.id
            return (
              <button
                key={rate.id}
                type="button"
                role="radio"
                aria-checked={checked}
                className={cn(
                  'flex min-w-0 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-[14px] transition-colors duration-150',
                  checked
                    ? 'border-ink bg-accent-soft/50 text-ink'
                    : 'border-line-2 text-ink-2 hover:bg-paper'
                )}
                onClick={() => setSelected(rate.id)}
              >
                <span className="min-w-0 truncate font-medium">{rate.name}</span>
                <span className="shrink-0">
                  {rate.price === 0 ? 'Free' : formatMoney(rate.price, currencyCode)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        {rateId && (
          <FormButton
            type="button"
            variant="danger"
            className="mr-auto"
            onClick={() => {
              onApply(null)
              onClose()
            }}
          >
            Remove
          </FormButton>
        )}
        <FormButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          disabled={!selected || !rates.some((rate) => rate.id === selected)}
          onClick={() => {
            onApply(selected)
            onClose()
          }}
        >
          Apply
        </FormButton>
      </div>
    </Dialog>
  )
}
