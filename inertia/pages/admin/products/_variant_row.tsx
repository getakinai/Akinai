import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { Boxes, Pencil, Trash2 } from 'lucide-react'
import { FormButton, FormSwitch, FormInput, FormInputNumber } from '~/components/form'
import { IconButton } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { cn, dataTable, iconButton } from '~/lib/styles'
import { variantLabel } from './_format'
import { useUpdateAdminVariant } from './_hooks'
import { VariantFormSchema, type AdminVariant } from './_types'

type VariantRowProps = {
  /** Store weight unit, for the weight field label. */
  weightUnit: string
  variant: AdminVariant
  editable: boolean
  canEditInventory: boolean
  canDelete: boolean
  onEditInventory: (variant: AdminVariant) => void
  onDelete: (variant: AdminVariant) => void
}

/**
 * One editable variant. Remount with a new `key` after a save to reset the
 * fields to the server values. Prices are set in the Market prices card, so
 * a row save resends the saved prices unchanged.
 */
export default function VariantRow({
  weightUnit,
  variant,
  editable,
  canEditInventory,
  canDelete,
  onEditInventory,
  onDelete,
}: VariantRowProps) {
  const [sku, setSku] = useState(variant.sku ?? '')
  const [barcode, setBarcode] = useState(variant.barcode ?? '')
  const [weight, setWeight] = useState<number | null>(variant.weight)
  const [trackInventory, setTrackInventory] = useState(variant.trackInventory)
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateVariant = useUpdateAdminVariant()
  const label = variantLabel(variant)

  const dirty =
    sku !== (variant.sku ?? '') ||
    barcode !== (variant.barcode ?? '') ||
    weight !== variant.weight ||
    trackInventory !== variant.trackInventory

  function onSave() {
    const parsed = VariantFormSchema.safeParse({
      sku: emptyToNull(sku),
      barcode: emptyToNull(barcode),
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      weight,
      trackInventory,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateVariant.mutate(
      { productId: variant.productId, id: variant.id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${variantLabel(saved)} saved`),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const fieldName = (name: string) => `variant-${variant.id}-${name}`

  return (
    <tr className={dataTable.row}>
      <td className={cn(dataTable.td, 'min-w-[160px]')}>
        <div className="text-[13.5px] font-medium text-ink">{label}</div>
      </td>
      <td className={cn(dataTable.td, 'w-[150px]')}>
        <FormInput
          name={fieldName('sku')}
          label={`SKU for ${label}`}
          hideLabel
          placeholder="SKU"
          autoComplete="off"
          value={sku}
          disabled={!editable}
          onChange={(event) => setSku(event.target.value)}
          error={errors.sku}
        />
      </td>
      <td className={cn(dataTable.td, 'w-[150px]')}>
        <FormInput
          name={fieldName('barcode')}
          label={`Barcode for ${label}`}
          hideLabel
          placeholder="Barcode"
          autoComplete="off"
          value={barcode}
          disabled={!editable}
          onChange={(event) => setBarcode(event.target.value)}
          error={errors.barcode}
        />
      </td>
      <td className={cn(dataTable.td, 'w-[100px]')}>
        <FormInputNumber
          name={fieldName('weight')}
          label={`Weight for ${label} (${weightUnit})`}
          hideLabel
          placeholder="—"
          value={weight}
          disabled={!editable}
          onChange={setWeight}
          error={errors.weight}
        />
      </td>
      <td className={dataTable.td}>
        <FormSwitch
          name={fieldName('trackInventory')}
          label="Track"
          checked={trackInventory}
          disabled={!editable}
          onChange={(event) => setTrackInventory(event.target.checked)}
        />
      </td>
      <td className={cn(dataTable.td, 'whitespace-nowrap')}>
        {variant.trackInventory ? (
          <div className="flex items-center gap-1">
            <span className={dataTable.mono}>{variant.availableTotal}</span>
            {canEditInventory && (
              <IconButton
                label={`Edit stock for ${label}`}
                size="sm"
                onClick={() => onEditInventory(variant)}
              >
                <Boxes size={15} />
              </IconButton>
            )}
          </div>
        ) : (
          <span className="text-[12.5px] text-muted">Not tracked</span>
        )}
      </td>
      <td className={cn(dataTable.td, 'w-[170px] text-right')}>
        <div className="flex items-center justify-end gap-1">
          {editable && (
            <FormButton
              type="button"
              size="sm"
              variant={dirty ? 'primary' : 'secondary'}
              disabled={!dirty}
              loading={updateVariant.isPending}
              loadingText="Saving…"
              onClick={onSave}
            >
              Save
            </FormButton>
          )}
          <Link
            route="admin.products.variants.edit"
            routeParams={{ productId: variant.productId, id: variant.id }}
            aria-label={`${editable ? 'Edit' : 'View'} ${label}`}
            title={editable ? 'Edit variant' : 'View variant'}
            className={cn(iconButton, 'size-7 border-transparent')}
          >
            <Pencil size={14} />
          </Link>
          {editable && (
            <IconButton
              label={canDelete ? `Delete ${label}` : 'A product needs at least one variant'}
              size="sm"
              disabled={!canDelete}
              onClick={() => onDelete(variant)}
            >
              <Trash2 size={14} />
            </IconButton>
          )}
        </div>
      </td>
    </tr>
  )
}
