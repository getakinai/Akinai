import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormSelectWithSearch } from '~/components/form'
import { Badge, Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateAdminStripe } from './_hooks'
import MarketsField from './_markets_field'
import {
  AdminStripeFormSchema,
  STRIPE_MODE_LABELS,
  STRIPE_MODES,
  StripeModeSchema,
  type AdminPaymentMarket,
  type AdminStripe,
  type AdminStripeKeys,
  type StripeMode,
} from './_types'

type StripeDialogProps = {
  open: boolean
  setup: AdminStripe
  markets: AdminPaymentMarket[]
  onClose: () => void
}

type KeyValues = { publishableKey: string; secretKey: string; webhookSecret: string }

const MODE_DESCRIPTIONS: Record<StripeMode, string> = {
  test: 'Test keys and Stripe test cards. No real money moves.',
  live: 'Real cards are charged.',
}

const otherMode = (mode: StripeMode): StripeMode => (mode === 'live' ? 'test' : 'live')

const keyValues = (stored: AdminStripeKeys | null): KeyValues => ({
  publishableKey: stored?.publishableKey ?? '',
  secretKey: '',
  webhookSecret: '',
})

export default function StripeDialog({ open, setup, markets, onClose }: StripeDialogProps) {
  const configured = setup.test !== null || setup.live !== null
  const [mode, setMode] = useState<StripeMode>(setup.mode ?? 'test')
  const [keys, setKeys] = useState<Record<StripeMode, KeyValues>>({
    test: keyValues(setup.test),
    live: keyValues(setup.live),
  })
  const [cancelUrl, setCancelUrl] = useState(setup.cancelUrl ?? '')
  const [marketIds, setMarketIds] = useState<string[]>(
    configured ? setup.marketIds : markets.map((market) => market.id)
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const update = useUpdateAdminStripe()
  const webhookUrl = `${window.location.origin}/stripe/webhook`
  const other = otherMode(mode)
  const otherHasErrors = Object.keys(errors).some((key) => key.startsWith(`${other}.`))
  const visibleModes = otherHasErrors ? [mode, other] : [mode]

  function changeMode(next: string) {
    setMode(StripeModeSchema.parse(next))
  }

  function setKey(keyMode: StripeMode, name: keyof KeyValues, value: string) {
    setKeys((current) => ({ ...current, [keyMode]: { ...current[keyMode], [name]: value } }))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const toForm = (values: KeyValues) => ({
      publishableKey: emptyToNull(values.publishableKey),
      secretKey: emptyToNull(values.secretKey),
      webhookSecret: emptyToNull(values.webhookSecret),
    })
    const parsed = AdminStripeFormSchema.safeParse({
      mode,
      test: toForm(keys.test),
      live: toForm(keys.live),
      marketIds,
      cancelUrl: emptyToNull(cancelUrl),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    const missingSecret = STRIPE_MODES.find(
      (keyMode) =>
        parsed.data[keyMode].publishableKey && !parsed.data[keyMode].secretKey && !setup[keyMode]
    )
    if (missingSecret) {
      const label = STRIPE_MODE_LABELS[missingSecret].toLowerCase()
      return setErrors({ [`${missingSecret}.secretKey`]: `Enter your ${label} secret key` })
    }

    setErrors({})
    update.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Stripe saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Stripe"
      description="Customers pay by card on a Stripe-hosted page."
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
              ? { label: 'Keys saved', tone: 'success' }
              : { label: 'No keys', tone: 'neutral' },
          }))}
        />

        {visibleModes.map((keyMode) => (
          <StripeKeyFields
            key={keyMode}
            mode={keyMode}
            stored={setup[keyMode]}
            values={keys[keyMode]}
            active={mode === keyMode}
            errors={errors}
            webhookUrl={webhookUrl}
            onChange={(name, value) => setKey(keyMode, name, value)}
          />
        ))}
        <FormInput
          name="cancelUrl"
          label="Cancel URL (optional)"
          tooltip="Where Stripe’s back link takes customers who leave the payment page. Leave blank to send them to their order."
          type="url"
          inputMode="url"
          placeholder="https://your-store.com/cart"
          autoComplete="off"
          spellCheck={false}
          value={cancelUrl}
          onChange={(event) => setCancelUrl(event.target.value)}
          error={errors.cancelUrl}
        />
        <MarketsField
          markets={markets}
          values={marketIds}
          onChange={setMarketIds}
          error={errors.marketIds}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton size="sm" loading={update.isPending} loadingText="Checking keys…">
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}

type StripeKeyFieldsProps = {
  mode: StripeMode
  stored: AdminStripeKeys | null
  values: KeyValues
  active: boolean
  errors: FieldErrors
  webhookUrl: string
  onChange: (name: keyof KeyValues, value: string) => void
}

function StripeKeyFields({
  mode,
  stored,
  values,
  active,
  errors,
  webhookUrl,
  onChange,
}: StripeKeyFieldsProps) {
  const label = STRIPE_MODE_LABELS[mode]
  const stripeMode = mode === 'live' ? 'live mode' : 'test mode'
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-card border border-line p-3">
      <legend className="flex flex-wrap items-center gap-2 px-1 text-[13.5px] font-medium text-ink">
        {label} keys
        {active ? (
          <Badge tone={mode === 'live' ? 'success' : 'warning'}>Active</Badge>
        ) : (
          <Badge tone="neutral">Not active</Badge>
        )}
      </legend>
      <FormInput
        name={`${mode}.publishableKey`}
        label="Publishable key"
        tooltip={
          <>
            In the Stripe dashboard, switch to {stripeMode} and open Developers → API keys.
            {stored && !active && ` Clear this key to remove the ${label.toLowerCase()} keys.`}
          </>
        }
        placeholder={`pk_${mode}_…`}
        autoComplete="off"
        spellCheck={false}
        value={values.publishableKey}
        onChange={(event) => onChange('publishableKey', event.target.value)}
        error={errors[`${mode}.publishableKey`]}
      />
      <FormInput
        name={`${mode}.secretKey`}
        label="Secret key"
        tooltip={
          stored
            ? `Leave blank to keep the current key ending in ${stored.secretKeyLastFour}. Keys are encrypted before they are stored.`
            : 'Keys are encrypted before they are stored.'
        }
        type="password"
        placeholder={stored ? `•••• ${stored.secretKeyLastFour}` : `sk_${mode}_…`}
        autoComplete="new-password"
        spellCheck={false}
        value={values.secretKey}
        onChange={(event) => onChange('secretKey', event.target.value)}
        error={errors[`${mode}.secretKey`]}
      />
      <FormInput
        name={`${mode}.webhookSecret`}
        label={
          stored?.hasWebhookSecret
            ? 'Webhook signing secret'
            : 'Webhook signing secret (recommended)'
        }
        tooltip={
          <>
            In Stripe {stripeMode}, add a webhook endpoint for{' '}
            <code className="font-mono break-all">{webhookUrl}</code> with the{' '}
            <code className="font-mono">checkout.session.completed</code> and{' '}
            <code className="font-mono">checkout.session.async_payment_succeeded</code> events. It
            marks orders paid even if the customer closes the page before returning to the store.
            {stored?.hasWebhookSecret && ' Leave blank to keep the current secret.'}
          </>
        }
        type="password"
        placeholder={stored?.hasWebhookSecret ? '••••••••' : 'whsec_…'}
        autoComplete="new-password"
        spellCheck={false}
        value={values.webhookSecret}
        onChange={(event) => onChange('webhookSecret', event.target.value)}
        error={errors[`${mode}.webhookSecret`]}
      />
    </fieldset>
  )
}
