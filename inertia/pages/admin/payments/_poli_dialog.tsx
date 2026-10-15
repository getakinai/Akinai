import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormSelectWithSearch } from '~/components/form'
import { Badge, Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateAdminPoli } from './_hooks'
import MarketsField from './_markets_field'
import {
  AdminPoliFormSchema,
  STRIPE_MODE_LABELS,
  STRIPE_MODES,
  StripeModeSchema,
  isPoliCurrency,
  type AdminPaymentMarket,
  type AdminPoli,
  type AdminPoliCredentials,
  type StripeMode,
} from './_types'

type PoliDialogProps = {
  open: boolean
  setup: AdminPoli
  markets: AdminPaymentMarket[]
  onClose: () => void
}

type CredentialValues = { merchantCode: string; authenticationCode: string }

const MODE_DESCRIPTIONS: Record<StripeMode, string> = {
  test: 'POLi’s UAT environment with test banks. No real money moves.',
  live: 'Real bank payments.',
}

const otherMode = (mode: StripeMode): StripeMode => (mode === 'live' ? 'test' : 'live')

const credentialValues = (stored: AdminPoliCredentials | null): CredentialValues => ({
  merchantCode: stored?.merchantCode ?? '',
  authenticationCode: '',
})

export default function PoliDialog({ open, setup, markets, onClose }: PoliDialogProps) {
  const eligibleMarkets = markets.filter((market) => isPoliCurrency(market.currencyCode))
  const configured = setup.test !== null || setup.live !== null
  const [mode, setMode] = useState<StripeMode>(setup.mode ?? 'test')
  const [credentials, setCredentials] = useState<Record<StripeMode, CredentialValues>>({
    test: credentialValues(setup.test),
    live: credentialValues(setup.live),
  })
  const [marketIds, setMarketIds] = useState<string[]>(
    configured ? setup.marketIds : eligibleMarkets.map((market) => market.id)
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const update = useUpdateAdminPoli()
  const nudgeUrl = `${window.location.origin}/poli/nudge`
  const other = otherMode(mode)
  const otherHasErrors = Object.keys(errors).some((key) => key.startsWith(`${other}.`))
  const visibleModes = otherHasErrors ? [mode, other] : [mode]

  function changeMode(next: string) {
    setMode(StripeModeSchema.parse(next))
  }

  function setValue(valueMode: StripeMode, name: keyof CredentialValues, value: string) {
    setCredentials((current) => ({
      ...current,
      [valueMode]: { ...current[valueMode], [name]: value },
    }))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const toForm = (values: CredentialValues) => ({
      merchantCode: emptyToNull(values.merchantCode),
      authenticationCode: emptyToNull(values.authenticationCode),
    })
    const parsed = AdminPoliFormSchema.safeParse({
      mode,
      test: toForm(credentials.test),
      live: toForm(credentials.live),
      marketIds,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    const missingCode = STRIPE_MODES.find(
      (valueMode) =>
        parsed.data[valueMode].merchantCode &&
        !parsed.data[valueMode].authenticationCode &&
        !setup[valueMode]
    )
    if (missingCode) {
      const label = STRIPE_MODE_LABELS[missingCode].toLowerCase()
      return setErrors({
        [`${missingCode}.authenticationCode`]: `Enter your ${label} authentication code`,
      })
    }

    setErrors({})
    update.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('POLi saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="POLi"
      description="Customers pay from their online banking on POLi’s page."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormSelectWithSearch
          name="mode"
          label="Payment mode"
          value={mode}
          onChange={changeMode}
          tooltip={
            <>
              {STRIPE_MODES.map((option) => (
                <span key={option} className="block">
                  <strong className="font-medium text-ink">{STRIPE_MODE_LABELS[option]}:</strong>{' '}
                  {MODE_DESCRIPTIONS[option]}
                </span>
              ))}
            </>
          }
          options={STRIPE_MODES.map((option) => ({
            value: option,
            label: STRIPE_MODE_LABELS[option],
            badge: setup[option]
              ? { label: 'Credentials saved', tone: 'success' }
              : { label: 'No credentials', tone: 'neutral' },
          }))}
        />

        {visibleModes.map((valueMode) => (
          <PoliCredentialFields
            key={valueMode}
            mode={valueMode}
            stored={setup[valueMode]}
            values={credentials[valueMode]}
            active={mode === valueMode}
            errors={errors}
            nudgeUrl={nudgeUrl}
            onChange={(name, value) => setValue(valueMode, name, value)}
          />
        ))}
        <MarketsField
          markets={eligibleMarkets}
          values={marketIds}
          onChange={setMarketIds}
          error={errors.marketIds}
          methodName="POLi"
          allLabel="All NZD and AUD markets"
          emptyText="POLi only takes NZD and AUD. Add an active market in one of those currencies to offer it."
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton size="sm" loading={update.isPending} loadingText="Saving…">
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}

type PoliCredentialFieldsProps = {
  mode: StripeMode
  stored: AdminPoliCredentials | null
  values: CredentialValues
  active: boolean
  errors: FieldErrors
  nudgeUrl: string
  onChange: (name: keyof CredentialValues, value: string) => void
}

function PoliCredentialFields({
  mode,
  stored,
  values,
  active,
  errors,
  nudgeUrl,
  onChange,
}: PoliCredentialFieldsProps) {
  const label = STRIPE_MODE_LABELS[mode]
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-card border border-line p-3">
      <legend className="flex flex-wrap items-center gap-2 px-1 text-[13.5px] font-medium text-ink">
        {label} credentials
        {active ? (
          <Badge tone={mode === 'live' ? 'success' : 'warning'}>Active</Badge>
        ) : (
          <Badge tone="neutral">Not active</Badge>
        )}
      </legend>
      <FormInput
        name={`${mode}.merchantCode`}
        label="Merchant code"
        tooltip={
          <>
            From your POLi {mode === 'live' ? 'production' : 'UAT'} account. POLi notifies{' '}
            <code className="font-mono break-all">{nudgeUrl}</code> when a payment finishes, so
            orders are marked paid even if the customer closes the page.
            {stored &&
              !active &&
              ` Clear this code to remove the ${label.toLowerCase()} credentials.`}
          </>
        }
        autoComplete="off"
        spellCheck={false}
        value={values.merchantCode}
        onChange={(event) => onChange('merchantCode', event.target.value)}
        error={errors[`${mode}.merchantCode`]}
      />
      <FormInput
        name={`${mode}.authenticationCode`}
        label="Authentication code"
        tooltip={
          stored
            ? `Leave blank to keep the current code ending in ${stored.authCodeLastFour}. Codes are encrypted before they are stored.`
            : 'Codes are encrypted before they are stored.'
        }
        type="password"
        placeholder={stored ? `•••• ${stored.authCodeLastFour}` : undefined}
        autoComplete="new-password"
        spellCheck={false}
        value={values.authenticationCode}
        onChange={(event) => onChange('authenticationCode', event.target.value)}
        error={errors[`${mode}.authenticationCode`]}
      />
    </fieldset>
  )
}
