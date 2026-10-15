import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormSwitch, FormInput, FormSelectWithSearch } from '~/components/form'
import { Dialog } from '~/components/ui'
import { CURRENCY_OPTIONS } from '~/lib/currencies'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminMarket } from './_hooks'
import { AdminMarketCreateFormSchema } from './_types'

type MarketDialogProps = {
  open: boolean
  onClose: () => void
}

export default function MarketDialog({ open, onClose }: MarketDialogProps) {
  const [name, setName] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const createMarket = useCreateAdminMarket()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminMarketCreateFormSchema.safeParse({
      name,
      currencyCode,
      pricesIncludeTax,
      countryCodes: [],
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createMarket.mutate(parsed.data, {
      onSuccess: (market) => {
        toast.success(`${market.name} created`)
        onClose()
        router.visit(`/admin/markets/edit/${market.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add market"
      description="A group of countries you sell to in one currency. Add countries on the next screen."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="marketName"
          label="Name"
          placeholder="Southeast Asia"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <FormSelectWithSearch
          name="marketCurrency"
          label="Currency"
          placeholder="Choose a currency"
          options={CURRENCY_OPTIONS}
          value={currencyCode}
          onChange={setCurrencyCode}
          error={errors.currencyCode}
        />
        <FormSwitch
          name="marketPricesIncludeTax"
          label="Prices include tax"
          checked={pricesIncludeTax}
          onChange={(event) => setPricesIncludeTax(event.target.checked)}
          error={errors.pricesIncludeTax}
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={createMarket.isPending}>
            Create market
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
