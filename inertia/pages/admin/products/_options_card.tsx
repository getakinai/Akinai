import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Dialog, InfoTooltip } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useAdminOptionsCatalog } from '../options/_hooks'
import { diffVariants } from './_combinations'
import { variantLabel } from './_format'
import { useUpdateAdminProductOptions } from './_hooks'
import { optionsError } from './_options_editor'
import OptionsPicker, {
  fromOptionPickerDrafts,
  toOptionPickerDrafts,
  type OptionPickerDraft,
} from './_options_picker'
import { ProductOptionsFormSchema, type AdminProductDetail, type ProductOptionForm } from './_types'

type OptionsCardProps = {
  product: AdminProductDetail
  editable: boolean
}

/**
 * The options a product varies by (Size, Color, …) and their values. Remount
 * with a new `key` after a save to reset the drafts to the server values.
 */
export default function OptionsCard({ product, editable }: OptionsCardProps) {
  const [drafts, setDrafts] = useState<OptionPickerDraft[]>(() =>
    toOptionPickerDrafts(product.options)
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [confirming, setConfirming] = useState<ProductOptionForm[] | null>(null)
  const updateOptions = useUpdateAdminProductOptions()
  const { data: catalog = [] } = useAdminOptionsCatalog()

  const nextOptions = fromOptionPickerDrafts(drafts)
  const savedOptions = fromOptionPickerDrafts(toOptionPickerDrafts(product.options))
  const { total, removed, added } = diffVariants(
    product.variants,
    savedOptions,
    nextOptions,
    catalog
  )
  const dirty = JSON.stringify(nextOptions) !== JSON.stringify(savedOptions)

  function save(options: ProductOptionForm[]) {
    updateOptions.mutate(
      { id: product.id, options },
      {
        onSuccess: (saved) => {
          setConfirming(null)
          toast.success(
            `${saved.variants.length} ${saved.variants.length === 1 ? 'variant' : 'variants'} saved`
          )
        },
        onError: (error) => {
          setConfirming(null)
          handleMutationError(error, setErrors)
        },
      }
    )
  }

  function persistOptions(nextDrafts: OptionPickerDraft[]) {
    setDrafts(nextDrafts)
    const parsed = ProductOptionsFormSchema.safeParse(fromOptionPickerDrafts(nextDrafts))
    if (!parsed.success) return setErrors({ options: parsed.error.issues[0].message })

    setErrors({})
    const preview = diffVariants(product.variants, savedOptions, parsed.data, catalog)
    if (preview.removed.length > 0) setConfirming(parsed.data)
    else save(parsed.data)
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Options</span>
          <div className="relative flex items-center gap-1">
            <h2 className={card.title}>
              {product.options.length === 0
                ? 'No options'
                : product.options.map(({ name }) => name).join(', ')}
            </h2>
            <InfoTooltip label="About options">
              Pick the options this product varies by, like Size and Color. Saving adds a variant
              for each new combination and removes variants that use a removed value. Variants you
              deleted by hand are not recreated.
            </InfoTooltip>
          </div>
        </div>
      </header>

      <OptionsPicker
        drafts={drafts}
        onChange={setDrafts}
        onRemoveConfirmed={editable ? persistOptions : undefined}
        disabled={!editable || updateOptions.isPending}
        error={optionsError(errors)}
      />

      {editable && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-muted">
            {dirty
              ? `${total} ${total === 1 ? 'variant' : 'variants'}: ${added.length} new, ${removed.length} removed`
              : `${total} ${total === 1 ? 'variant' : 'variants'}`}
          </span>
          <FormButton
            type="button"
            size="sm"
            disabled={!dirty}
            loading={updateOptions.isPending && confirming === null}
            loadingText="Saving…"
            onClick={() => persistOptions(drafts)}
          >
            Save options
          </FormButton>
        </div>
      )}

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Remove variants?"
        description="These variants use values or options you removed. They will be deleted along with their SKU, price and stock."
      >
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-[13.5px] text-ink">
          {removed.map((variant) => (
            <li key={variant.id} className="flex min-w-0 justify-between gap-3">
              <span className="min-w-0 truncate">{variantLabel(variant)}</span>
              <span className="shrink-0 font-mono text-[12px] text-muted">
                {variant.sku ?? 'no SKU'} · {variant.availableTotal} in stock
              </span>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap justify-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            if (confirming) save(confirming)
          }}
        >
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(null)}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" variant="danger" size="sm" loading={updateOptions.isPending}>
            Remove {removed.length} {removed.length === 1 ? 'variant' : 'variants'}
          </FormButton>
        </form>
      </Dialog>
    </section>
  )
}
