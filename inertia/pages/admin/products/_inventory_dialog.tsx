import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { FormButton, FormInputNumber } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { inlineLink } from '~/lib/styles'
import { useUpdateVariantInventory } from './_hooks'
import { InventoryFormSchema, type AdminVariant } from './_types'

type InventoryDialogProps = {
  variant: AdminVariant
  onClose: () => void
}

/**
 * Sets the available quantity of a tracked variant at each active location.
 */
export default function InventoryDialog({ variant, onClose }: InventoryDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(
      variant.inventory.map(({ locationId, available }) => [locationId, available])
    )
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateInventory = useUpdateVariantInventory()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = InventoryFormSchema.safeParse({
      levels: variant.inventory.map(({ locationId }) => ({
        locationId,
        available: quantities[locationId],
      })),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateInventory.mutate(
      { productId: variant.productId, id: variant.id, ...parsed.data },
      {
        onSuccess: (saved) => {
          toast.success(`Stock for ${saved.title} saved`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  const total = Object.values(quantities).reduce<number>((sum, value) => sum + (value ?? 0), 0)

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Stock · ${variant.title}`}
      description={
        variant.sku ? `SKU ${variant.sku}. Set the units available at each location.` : undefined
      }
    >
      {variant.inventory.length === 0 ? (
        <p className="text-[13.5px] text-muted">
          There are no active locations.{' '}
          <Link route="admin.locations.home" className={inlineLink}>
            Add a location
          </Link>{' '}
          to start tracking stock.
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {variant.inventory.map((row, index) => (
            <FormInputNumber
              key={row.locationId}
              name={`inventory-${row.locationId}`}
              label={row.locationName}
              inputMode="numeric"
              value={quantities[row.locationId] ?? null}
              onChange={(value) =>
                setQuantities((current) => ({ ...current, [row.locationId]: value }))
              }
              error={errors[`levels.${index}.available`] ?? errors[`levels.${index}.locationId`]}
            />
          ))}
          {errors.levels && <span className="text-[12.5px] text-danger">{errors.levels}</span>}
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[13px] text-muted">{total} available in total</span>
            <div className="flex gap-2.5">
              <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </FormButton>
              <FormButton size="sm" loading={updateInventory.isPending}>
                Save stock
              </FormButton>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
}
