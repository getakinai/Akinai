import { useState, type ReactNode } from 'react'
import { type FieldErrors } from '~/lib/http'
import { card, cn } from '~/lib/styles'
import { formatMoney } from '../_format'
import SummaryRow from '../_summary_row'
import { type DraftOrderQuote } from '../_types'
import DiscountDialog from './_discount_dialog'
import ShippingDialog from './_shipping_dialog'

type PaymentCardProps = {
  quote: DraftOrderQuote | undefined
  isCalculating: boolean
  hasLines: boolean
  itemCount: number
  currencyCode: string
  discountCode: string | null
  onDiscountCodeChange: (code: string | null) => void
  shippingRateId: string | null
  onShippingRateChange: (rateId: string | null) => void
  hasAddress: boolean
  errors: FieldErrors
  disabled?: boolean
  actions?: ReactNode
}

export default function PaymentCard({
  quote,
  isCalculating,
  hasLines,
  itemCount,
  currencyCode,
  discountCode,
  onDiscountCodeChange,
  shippingRateId,
  onShippingRateChange,
  hasAddress,
  errors,
  disabled = false,
  actions,
}: PaymentCardProps) {
  const [discountOpen, setDiscountOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const money = (amount: number) => formatMoney(amount, currencyCode)
  const pending = !quote || !hasLines
  const shippingRate = quote?.shippingRates.find((rate) => rate.id === shippingRateId)
  const appliedDiscount = quote?.discount ?? quote?.shippingDiscount ?? null

  const open = (setOpen: (open: boolean) => void) => {
    setDialogKey((key) => key + 1)
    setOpen(true)
  }

  const actionLink = (label: string, onClick: () => void) => (
    <button
      type="button"
      className={cn(card.action, 'disabled:pointer-events-none disabled:opacity-45')}
      disabled={disabled || !hasLines}
      onClick={onClick}
    >
      {label}
    </button>
  )

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Payment</span>
          <h2 className={card.title}>Summary</h2>
        </div>
        {isCalculating && <span className="text-[12.5px] text-muted">Calculating…</span>}
      </header>

      <div
        className={cn(
          'divide-y divide-line transition-opacity duration-150',
          isCalculating && 'opacity-60'
        )}
      >
        <SummaryRow
          label="Subtotal"
          detail={hasLines ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : null}
          amount={pending ? '—' : money(quote.subtotal)}
        />
        <SummaryRow
          label={
            discountCode
              ? actionLink('Discount', () => open(setDiscountOpen))
              : actionLink('Add discount', () => open(setDiscountOpen))
          }
          detail={
            discountCode &&
            (appliedDiscount ? `${discountCode} · ${appliedDiscount.title}` : discountCode)
          }
          amount={
            pending || !discountCode
              ? '—'
              : `−${money(quote.discountTotal + quote.shippingDiscountTotal)}`
          }
          error={errors.discountCode}
        />
        <SummaryRow
          label={
            shippingRateId
              ? actionLink('Shipping', () => open(setShippingOpen))
              : actionLink('Add shipping or delivery', () => open(setShippingOpen))
          }
          detail={shippingRate?.name}
          amount={
            pending || !shippingRateId
              ? '—'
              : money(quote.shippingTotal + quote.shippingDiscountTotal)
          }
          error={errors.shippingRateId}
        />
        <SummaryRow
          label="Estimated tax"
          detail={
            !quote || !hasLines
              ? null
              : !quote.taxCalculated
                ? 'Not calculated'
                : quote.tax
                  ? `${quote.tax.name} ${quote.tax.rate}%${
                      quote.market.pricesIncludeTax ? ' (included)' : ''
                    }`
                  : 'No tax for this address'
          }
          amount={pending || !quote.taxCalculated ? '—' : money(quote.taxTotal)}
        />
        <SummaryRow
          strong
          label="Total"
          detail={currencyCode}
          amount={pending ? money(0) : money(quote.total)}
        />
      </div>

      <footer className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        {!hasLines ? (
          <p className="text-[13.5px] text-muted">
            Add a product to calculate total and view payment options.
          </p>
        ) : (
          actions && <div className="flex flex-wrap justify-end gap-2.5">{actions}</div>
        )}
      </footer>

      <DiscountDialog
        key={`discount-${dialogKey}`}
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        code={discountCode}
        onApply={onDiscountCodeChange}
      />
      <ShippingDialog
        key={`shipping-${dialogKey}`}
        open={shippingOpen}
        onClose={() => setShippingOpen(false)}
        rates={quote?.shippingRates ?? []}
        hasAddress={hasAddress}
        currencyCode={currencyCode}
        rateId={shippingRateId}
        onApply={onShippingRateChange}
      />
    </section>
  )
}
