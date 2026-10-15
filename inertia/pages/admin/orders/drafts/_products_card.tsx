import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormButton, FormInputNumber } from '~/components/form'
import { IconButton } from '~/components/ui'
import { type FieldErrors } from '~/lib/http'
import { card, field } from '~/lib/styles'
import { formatMoney, variantTitle } from '../_format'
import { type DraftLine, type OrderVariantOption } from '../_types'
import VariantPickerDialog from './_variant_picker_dialog'

type ProductsCardProps = {
  lines: DraftLine[]
  onChange: (lines: DraftLine[]) => void
  currencyCode: string
  /** Line totals from the latest quote, by variant id. */
  lineTotals: Map<string, number>
  errors: FieldErrors
  disabled?: boolean
}

export default function ProductsCard({
  lines,
  onChange,
  currencyCode,
  lineTotals,
  errors,
  disabled = false,
}: ProductsCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKey, setPickerKey] = useState(0)

  const openPicker = () => {
    setPickerKey((key) => key + 1)
    setPickerOpen(true)
  }

  const addVariants = (variants: OrderVariantOption[]) =>
    onChange([
      ...lines,
      ...variants.map((variant) => ({
        variantId: variant.id,
        productTitle: variant.productTitle,
        variantTitle: variant.title,
        sku: variant.sku,
        unitPrice: variant.price,
        quantity: 1,
      })),
    ])

  const updateQuantity = (index: number, quantity: number | null) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, quantity } : line)))

  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index))

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Order</span>
          <h2 className={card.title}>Products</h2>
        </div>
        {lines.length > 0 && !disabled && (
          <button type="button" className={card.action} onClick={openPicker}>
            <Plus size={14} /> Add products
          </button>
        )}
      </header>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-2 px-4 py-10 text-center">
          <p className="text-[13.5px] text-muted">Add the products this customer is buying.</p>
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={openPicker}
          >
            <Plus size={14} /> Add products
          </FormButton>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {lines.map((line, index) => {
            const lineError =
              errors[`lineItems.${index}.variantId`] ?? errors[`lineItems.${index}.quantity`]
            const total = lineTotals.get(line.variantId) ?? line.unitPrice * (line.quantity ?? 0)
            return (
              <li
                key={line.variantId}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_96px_110px_auto]"
              >
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="truncate text-[14px] font-medium text-ink">{line.productTitle}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {[
                      variantTitle(line.variantTitle),
                      line.sku,
                      formatMoney(line.unitPrice, currencyCode),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {lineError && <p className={field.error}>{lineError}</p>}
                </div>
                <div className="flex items-center gap-3 sm:contents">
                  <div className="w-24">
                    <FormInputNumber
                      name={`lineItems.${index}.quantity`}
                      label={`Quantity of ${line.productTitle}`}
                      hideLabel
                      inputMode="numeric"
                      value={line.quantity}
                      disabled={disabled}
                      onChange={(value) => updateQuantity(index, value)}
                    />
                  </div>
                  <span className="text-right text-[14px] text-ink">
                    {formatMoney(total, currencyCode)}
                  </span>
                </div>
                <IconButton
                  label={`Remove ${line.productTitle}`}
                  size="sm"
                  disabled={disabled}
                  onClick={() => removeLine(index)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}

      {errors.lineItems && <p className={`${field.error} mt-3 block`}>{errors.lineItems}</p>}

      <VariantPickerDialog
        key={pickerKey}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currencyCode={currencyCode}
        addedIds={lines.map((line) => line.variantId)}
        onAdd={addVariants}
      />
    </section>
  )
}
