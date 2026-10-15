import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormInput, FormSelect, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateAdminBankTransfer } from './_hooks'
import {
  AdminBankTransferFormSchema,
  PAYMENT_REGIONS,
  type AdminBankTransfer,
  type AdminBankTransferMarket,
  type PaymentRegion,
} from './_types'

const COUNTRY_OPTIONS = [
  { value: 'NZ', label: 'New Zealand' },
  { value: 'AU', label: 'Australia' },
]

type BankTransferDialogProps = {
  open: boolean
  setup: AdminBankTransfer
  initialMarketId: string | null
  onClose: () => void
}

function marketRegion(market: AdminBankTransferMarket): PaymentRegion {
  return (
    PAYMENT_REGIONS.find((region) => market.countryCodes.includes(region)) ?? PAYMENT_REGIONS[0]
  )
}

export default function BankTransferDialog({
  open,
  setup,
  initialMarketId,
  onClose,
}: BankTransferDialogProps) {
  const [marketId, setMarketId] = useState(
    setup.markets.find((market) => market.marketId === initialMarketId)?.marketId ??
      setup.markets[0]?.marketId ??
      ''
  )
  const market = setup.markets.find((entry) => entry.marketId === marketId)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bank transfer"
      description="Each market has its own bank account. Customers see the account for their market at checkout and pay using HPDL plus their order number (e.g. HPDL1001) as the reference."
    >
      {market ? (
        <div className="flex flex-col gap-4">
          <FormSelect
            name="marketId"
            label="Market"
            options={setup.markets.map((entry) => ({
              value: entry.marketId,
              label: entry.marketName,
            }))}
            value={marketId}
            onChange={(event) => setMarketId(event.target.value)}
          />
          <BankTransferMarketForm key={market.marketId} market={market} onClose={onClose} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted">
            Add an active market before setting up bank transfer.
          </p>
          <div className="flex justify-end">
            <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
              Close
            </FormButton>
          </div>
        </div>
      )}
    </Dialog>
  )
}

function BankTransferMarketForm({
  market,
  onClose,
}: {
  market: AdminBankTransferMarket
  onClose: () => void
}) {
  const [countryCode, setCountryCode] = useState<PaymentRegion>(
    market.countryCode ?? marketRegion(market)
  )
  const [accountName, setAccountName] = useState(market.accountName ?? '')
  const [bankName, setBankName] = useState(market.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(market.accountNumber ?? '')
  const [bsb, setBsb] = useState(market.bsb ?? '')
  const [instructions, setInstructions] = useState(market.instructions ?? '')
  const [isEnabled, setIsEnabled] = useState(market.countryCode ? market.isEnabled : true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const update = useUpdateAdminBankTransfer()
  const isAu = countryCode === 'AU'

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminBankTransferFormSchema.safeParse({
      isEnabled,
      countryCode,
      accountName,
      bankName,
      accountNumber: accountNumber.trim(),
      bsb: isAu ? emptyToNull(bsb) : null,
      instructions: emptyToNull(instructions),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    update.mutate(
      { marketId: market.marketId, payload: parsed.data },
      {
        onSuccess: () => {
          toast.success(`Bank transfer saved for ${market.marketName}`)
          onClose()
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <FormSelect
        name="countryCode"
        label="Bank account country"
        options={COUNTRY_OPTIONS}
        value={countryCode}
        onChange={(event) => setCountryCode(event.target.value as PaymentRegion)}
        error={errors.countryCode}
      />
      <FormInput
        name="accountName"
        label="Account name"
        value={accountName}
        onChange={(event) => setAccountName(event.target.value)}
        error={errors.accountName}
      />
      <FormInput
        name="bankName"
        label="Bank name"
        placeholder={isAu ? 'e.g. Commonwealth Bank' : 'e.g. ANZ'}
        value={bankName}
        onChange={(event) => setBankName(event.target.value)}
        error={errors.bankName}
      />
      {isAu ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <FormInput
            name="bsb"
            label="BSB"
            inputMode="numeric"
            placeholder="000-000"
            value={bsb}
            onChange={(event) => setBsb(event.target.value)}
            error={errors.bsb}
          />
          <FormInput
            name="accountNumber"
            label="Account number"
            inputMode="numeric"
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            error={errors.accountNumber}
          />
        </div>
      ) : (
        <FormInput
          name="accountNumber"
          label="Account number"
          inputMode="numeric"
          placeholder="00-0000-0000000-00"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          error={errors.accountNumber}
        />
      )}
      <FormTextarea
        name="instructions"
        label="Payment instructions (optional)"
        rows={3}
        maxLength={500}
        placeholder="e.g. Orders ship once the payment clears, usually within 1–2 business days."
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
        error={errors.instructions}
      />
      <FormSwitch
        name="isEnabled"
        label={`Show at checkout in ${market.marketName}`}
        checked={isEnabled}
        onChange={(event) => setIsEnabled(event.target.checked)}
      />
      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton size="sm" loading={update.isPending}>
          Save
        </FormButton>
      </div>
    </form>
  )
}
