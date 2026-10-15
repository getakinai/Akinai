import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  FormButton,
  FormSwitch,
  FormInput,
  FormInputNumber,
  FormSelectWithSearch,
} from '~/components/form'
import { Dialog } from '~/components/ui'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminTaxRate, useUpdateAdminTaxRate } from './_hooks'
import { AdminTaxRateFormSchema, type AdminTaxRate } from './_types'

type TaxRateDialogProps = {
  open: boolean
  taxRate: AdminTaxRate | null
  onClose: () => void
}

/**
 * Creates a tax rate when `taxRate` is null, otherwise edits it. Remount
 * with a new `key` to reset the fields between rates.
 */
export default function TaxRateDialog({ open, taxRate, onClose }: TaxRateDialogProps) {
  const [name, setName] = useState(taxRate?.name ?? '')
  const [countryCode, setCountryCode] = useState(taxRate?.countryCode ?? '')
  const [regionCode, setRegionCode] = useState(taxRate?.regionCode ?? '')
  const [rate, setRate] = useState<number | null>(taxRate?.rate ?? null)
  const [appliesToShipping, setAppliesToShipping] = useState(taxRate?.appliesToShipping ?? false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const createTaxRate = useCreateAdminTaxRate()
  const updateTaxRate = useUpdateAdminTaxRate()
  const isPending = createTaxRate.isPending || updateTaxRate.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminTaxRateFormSchema.safeParse({
      name,
      countryCode,
      regionCode: emptyToNull(regionCode),
      rate,
      appliesToShipping,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminTaxRate) => {
        toast.success(taxRate ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (taxRate) {
      updateTaxRate.mutate({ id: taxRate.id, ...parsed.data }, options)
    } else {
      createTaxRate.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={taxRate ? 'Edit tax rate' : 'Add tax rate'}
      description="Leave the region empty for a rate that covers the whole country. A region rate replaces the country rate there."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="taxName"
          label="Name"
          placeholder="VAT"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <FormSelectWithSearch
          name="taxCountry"
          label="Country"
          placeholder="Choose a country"
          options={COUNTRY_OPTIONS}
          value={countryCode}
          onChange={setCountryCode}
          error={errors.countryCode}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            name="taxRegion"
            label="Region code (optional)"
            placeholder="NCR"
            autoComplete="off"
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value)}
            error={errors.regionCode}
          />
          <FormInputNumber
            name="taxRate"
            label="Rate (%)"
            placeholder="12"
            value={rate}
            onChange={setRate}
            error={errors.rate}
          />
        </div>
        <FormSwitch
          name="taxAppliesToShipping"
          label="Also charge this tax on shipping"
          checked={appliesToShipping}
          onChange={(event) => setAppliesToShipping(event.target.checked)}
          error={errors.appliesToShipping}
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {taxRate ? 'Save changes' : 'Create tax rate'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
