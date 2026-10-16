import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  ShoppingBasket,
  Trash2,
} from 'lucide-react'
import { useCart } from 'snappycart'
import {
  FormAddressAutocomplete,
  FormButton,
  FormSwitch,
  FormInput,
  FormRadioCards,
  FormRegionField,
  FormSelect,
  type FormRadioCardOption,
} from '~/components/form'
import RecaptchaNotice from '~/components/recaptcha_notice'
import { Skeleton } from '~/components/ui'
import { useCartReady } from '~/hooks/use_cart_persistence'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { usePreloadRecaptcha } from '~/hooks/use_preload_recaptcha'
import CheckoutLayout from '~/layouts/checkout'
import { trackEvent } from '~/lib/analytics'
import { COUNTRIES } from '~/lib/countries'
import { hasRegions, regionValueFor } from '~/lib/country_regions'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { HttpError, type FieldErrors } from '~/lib/http'
import { MARKETING_CONSENT_LABEL } from '~/lib/marketing'
import { formatMoney } from '~/lib/money'
import {
  DEFAULT_CHECKOUT_DELIVERY_HEADING,
  DEFAULT_CHECKOUT_DELIVERY_NOTE,
} from '~/lib/store_settings'
import { cn, storefront } from '~/lib/styles'
import {
  useStoreMarket,
  useStoreMoney,
  useStoreSettings,
  useStorefrontSession,
} from '~/pages/_hooks'
import BankDetails from './_bank_details'
import DiscountCodeForm from './_discount_code_form'
import { discountLabel, shippingDiscountLabel } from './_discount_labels'
import {
  useCheckoutAddresses,
  useCheckoutCustomer,
  useCheckoutPaymentMethods,
  useCheckoutQuote,
  usePlaceOrder,
} from './_hooks'
import {
  CheckoutFormSchema,
  isOnlinePayment,
  type CheckoutQuoteInput,
  type CheckoutSavedAddress,
  type PaymentMethod,
} from './_types'
import OrderSummary, { type OrderSummaryLine } from './_order_summary'

type FormState = {
  email: string
  countryCode: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  province: string
  regionCode: string
  postalCode: string
  phone: string
  shippingRateId: string | null
  paymentMethod: PaymentMethod | null
  saveAddress: boolean
  acceptsMarketing: boolean
}

const INITIAL_FORM: FormState = {
  email: '',
  countryCode: '',
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  province: '',
  regionCode: '',
  postalCode: '',
  phone: '',
  shippingRateId: null,
  paymentMethod: null,
  saveAddress: false,
  acceptsMarketing: true,
}

const EMPTY_ADDRESS = {
  address1: '',
  address2: '',
  city: '',
  province: '',
  regionCode: '',
  postalCode: '',
} satisfies Partial<FormState>

const NEW_ADDRESS = 'new'

const COUNTRY_NAMES = new Map(COUNTRIES.map(({ code, name }) => [code, name]))

/** Treats the last word as the last name, which is the only required part. */
function splitName(fullName: string | null | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

function SavedAddressLabel({ address }: { address: CheckoutSavedAddress }) {
  const locality = [address.city, address.province, address.postalCode].filter(Boolean).join(' ')
  const details = [
    address.address1,
    address.address2,
    locality,
    COUNTRY_NAMES.get(address.countryCode) ?? address.countryCode,
  ].filter(Boolean)

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {address.fullName && <span>{address.fullName}</span>}
      <span className="text-[13px] font-normal text-pretty text-sf-muted">
        {details.join(', ')}
      </span>
    </span>
  )
}

const sectionTitle = 'text-[19px] font-semibold tracking-[-0.01em]'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className={sectionTitle}>{title}</h2>
        {description && <p className="mt-0.5 text-[13.5px] text-sf-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/**
 * A titled group inside a Section, separated from the fields above by a
 * divider. `highlight` draws it as a tinted panel instead.
 */
function Subsection({
  title,
  description,
  highlight = false,
  children,
}: {
  title: string
  description?: string
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mt-2 flex min-w-0 flex-col gap-3',
        highlight
          ? 'rounded-lg border border-sf-primary/30 bg-sf-primary-soft p-4'
          : 'border-t border-sf-line pt-5'
      )}
    >
      <div className={cn(highlight && 'flex items-start gap-3')}>
        {highlight && (
          <span className="grid size-9 flex-none place-items-center rounded-full bg-sf-surface text-sf-primary">
            <MapPin size={18} />
          </span>
        )}
        <div className={cn(highlight && 'min-w-0 pt-1.5')}>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-sf-muted">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function DeliveryHeader() {
  const { data: settings, isLoading } = useStoreSettings()

  return isLoading ? (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  ) : (
    <div className="min-w-0">
      <h2 className={cn(sectionTitle, 'text-pretty')}>
        {settings?.checkoutDeliveryHeading ?? DEFAULT_CHECKOUT_DELIVERY_HEADING}
      </h2>
      <p className="mt-0.5 text-[13.5px] text-pretty whitespace-pre-line text-sf-muted">
        {settings?.checkoutDeliveryNote ?? DEFAULT_CHECKOUT_DELIVERY_NOTE}
      </p>
    </div>
  )
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-sf-bg px-4 py-5 text-center text-[14px] text-sf-muted">
      {children}
    </p>
  )
}

export default function CheckoutHome() {
  const { items, removeItem } = useCart()
  const cartReady = useCartReady()
  const hasItems = cartReady && items.length > 0
  useEffect(() => {
    if (hasItems) trackEvent('checkout_started')
  }, [hasItems])
  const { data: market } = useStoreMarket()
  const storeMoney = useStoreMoney()
  const shippingCountryCodes = market?.shippingCountryCodes ?? []
  const countryOptions = shippingCountryCodes.map((code) => ({
    value: code,
    label: COUNTRY_NAMES.get(code) ?? code,
  }))
  const sessionQuery = useStorefrontSession()
  const signedIn = sessionQuery.data?.signedIn ?? false
  const { data: customer } = useCheckoutCustomer(signedIn)
  const addressesQuery = useCheckoutAddresses(signedIn)
  const savedAddresses = addressesQuery.data ?? []
  const hasSavedAddresses = savedAddresses.length > 0
  const showMarketingOptIn = signedIn ? customer?.acceptsMarketing === false : true
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [addressChoice, setAddressChoice] = useState<string | null>(null)
  const [namesPrefilled, setNamesPrefilled] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | undefined>()
  const placeOrder = usePlaceOrder()
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  usePreloadRecaptcha()
  const paymentMethods = useCheckoutPaymentMethods()
  const enabledMethods = paymentMethods.data ?? []

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  function changeCountry(code: string) {
    setForm((current) =>
      current.countryCode === code
        ? current
        : { ...current, ...EMPTY_ADDRESS, countryCode: code, shippingRateId: null }
    )
  }

  function chooseAddress(id: string) {
    setAddressChoice(id)
    if (id === NEW_ADDRESS) {
      setForm((current) => ({
        ...current,
        ...EMPTY_ADDRESS,
        countryCode: '',
        shippingRateId: null,
        saveAddress: false,
      }))
      return
    }

    const address = savedAddresses.find((saved) => saved.id === id)
    if (!address) return
    const names = splitName(address.fullName)
    setForm((current) => ({
      ...current,
      firstName: address.fullName ? names.firstName : current.firstName,
      lastName: address.fullName ? names.lastName : current.lastName,
      countryCode: address.countryCode,
      address1: address.address1,
      address2: address.address2 ?? '',
      city: address.city,
      ...regionValueFor(address.countryCode, address.province, address.regionCode),
      postalCode: address.postalCode ?? '',
      phone: address.phone ?? current.phone,
      saveAddress: false,
    }))
  }

  if (customer && !namesPrefilled) {
    setNamesPrefilled(true)
    const names = splitName(customer.fullName)
    setForm((current) => ({
      ...current,
      firstName: current.firstName || names.firstName,
      lastName: current.lastName || names.lastName,
      phone: current.phone || customer.phone || '',
    }))
  }

  if (addressChoice === null && addressesQuery.isSuccess) {
    if (hasSavedAddresses) chooseAddress(savedAddresses[0].id)
    else setAddressChoice(NEW_ADDRESS)
  }

  if (addressChoice === NEW_ADDRESS && form.countryCode === '') {
    const customerCountry =
      customer?.countryCode && shippingCountryCodes.includes(customer.countryCode)
        ? customer.countryCode
        : null
    const soleCountry = shippingCountryCodes.length === 1 ? shippingCountryCodes[0] : null
    const nextCountry = customerCountry ?? soleCountry
    if (nextCountry) changeCountry(nextCountry)
  }

  const usingSavedAddress = hasSavedAddresses && addressChoice !== NEW_ADDRESS
  const chosenSavedAddress = usingSavedAddress
    ? savedAddresses.find((saved) => saved.id === addressChoice)
    : undefined
  const savedAddressIncomplete =
    chosenSavedAddress !== undefined &&
    (!chosenSavedAddress.province?.trim() ||
      !chosenSavedAddress.postalCode?.trim() ||
      (hasRegions(chosenSavedAddress.countryCode) && !form.regionCode))
  const countryChosen = form.countryCode !== ''
  const deliveryLoading = sessionQuery.isLoading || (signedIn && addressesQuery.isLoading)

  const lines = useMemo(
    () =>
      items.flatMap((line) => {
        const variantId = line.product.metadata?.variantId
        return typeof variantId === 'string' ? [{ ...line, variantId }] : []
      }),
    [items]
  )
  const legacyLines = items.filter((line) => typeof line.product.metadata?.variantId !== 'string')

  const countryCode = form.countryCode || shippingCountryCodes[0] || ''
  const addressReady = countryChosen && form.address1.trim() !== '' && form.city.trim() !== ''

  const quoteInput = useDebouncedValue<CheckoutQuoteInput | null>(
    cartReady && lines.length > 0 && countryCode
      ? {
          lineItems: lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
          countryCode,
          province: form.province.trim() || null,
          regionCode: form.regionCode || null,
          postalCode: form.postalCode.trim() || null,
          shippingRateId: addressReady ? form.shippingRateId : null,
          discountCode: appliedCode,
        }
      : null,
    350
  )
  const quote = useCheckoutQuote(quoteInput)

  function applyCode() {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    setCodeError(undefined)
    setAppliedCode(code)
  }

  function rejectCode(message: string) {
    setCodeInput(appliedCode ?? '')
    setAppliedCode(null)
    setCodeError(message)
  }

  function removeCode() {
    setAppliedCode(null)
    setCodeInput('')
    setCodeError(undefined)
  }
  const rates = addressReady ? (quote.data?.shippingRates ?? []) : []

  if (rates.length > 0 && !rates.some((rate) => rate.id === form.shippingRateId)) {
    set('shippingRateId', rates[0].id)
  }

  if (
    enabledMethods.length > 0 &&
    !enabledMethods.some((method) => method.code === form.paymentMethod)
  ) {
    set('paymentMethod', enabledMethods[0].code)
  }

  const money = {
    ...storeMoney,
    currencyCode: quote.data?.currencyCode ?? storeMoney.currencyCode,
  }
  const format = (amount: number) => formatMoney(amount, money)

  const quoteErrors = quote.error instanceof HttpError ? quote.error : null
  const codeRejection = quoteErrors?.fieldErrors.discountCode
  if (appliedCode && codeRejection && quoteInput?.discountCode === appliedCode) {
    rejectCode(codeRejection)
  }
  const codeConfirmed =
    appliedCode !== null &&
    (quote.data?.discountCode === appliedCode || quote.data?.shippingDiscountCode === appliedCode)
  const unavailable = Object.keys(quoteErrors?.fieldErrors ?? {}).flatMap((key) => {
    const match = key.match(/^lineItems\.(\d+)\./)
    const line = match ? lines[Number(match[1])] : undefined
    return line ? [line] : []
  })
  const lineErrors = Object.entries(errors).filter(([key]) => key.startsWith('lineItems'))

  const quotedTotals = new Map(
    (quote.data?.lineItems ?? []).map((line) => [line.variantId, line.lineTotal])
  )
  const summaryLines: OrderSummaryLine[] = lines.map((line) => ({
    key: line.variantId,
    title: line.product.name,
    subtitle:
      typeof line.product.metadata?.vendor === 'string' ? line.product.metadata.vendor : null,
    quantity: line.quantity,
    lineTotal: format(quotedTotals.get(line.variantId) ?? line.product.price * line.quantity),
    imageUrl: line.product.imageUrl ?? null,
  }))
  const selectedRate = rates.find((rate) => rate.id === quote.data?.shippingRateId)
  const showTax = quote.data?.taxCalculated && quote.data.taxTotal > 0
  const renderSummary = (placement: 'drawer' | 'sidebar') => (
    <OrderSummary
      lines={summaryLines}
      subtotal={quote.data ? format(quote.data.subtotal) : null}
      discount={
        quote.data && quote.data.discountTotal > 0 ? format(quote.data.discountTotal) : null
      }
      discountLabel={discountLabel(
        quote.data?.discountCode ?? null,
        quote.data?.discountTitle ?? null
      )}
      discountForm={
        <DiscountCodeForm
          name={`discountCode-${placement}`}
          value={codeInput}
          applied={codeConfirmed ? appliedCode : null}
          error={codeError}
          pending={appliedCode !== null && !codeConfirmed && !quote.isError}
          onChange={(value) => {
            setCodeInput(value)
            setCodeError(undefined)
          }}
          onApply={applyCode}
          onRemove={removeCode}
        />
      }
      shipping={
        selectedRate
          ? format(quote.data!.shippingTotal + quote.data!.shippingDiscountTotal)
          : 'Enter shipping address'
      }
      shippingIsHint={!selectedRate}
      shippingDiscount={
        selectedRate && quote.data!.shippingDiscountTotal > 0
          ? format(quote.data!.shippingDiscountTotal)
          : null
      }
      shippingDiscountLabel={shippingDiscountLabel(quote.data?.shippingDiscountTitle ?? null)}
      tax={
        showTax
          ? {
              label: quote.data!.pricesIncludeTax
                ? `Includes ${quote.data!.taxName ?? 'tax'}`
                : (quote.data!.taxName ?? 'Tax'),
              amount: format(quote.data!.taxTotal),
            }
          : null
      }
      total={quote.data ? format(quote.data.total) : null}
      currencyCode={money.currencyCode}
      compact={placement === 'drawer'}
      className={placement === 'sidebar' ? 'max-h-full' : undefined}
    />
  )

  const parsedForm = CheckoutFormSchema.safeParse({
    ...form,
    email: customer?.email ?? form.email,
    address2: form.address2 || null,
    saveAddress: signedIn && form.saveAddress,
    discountCode: codeConfirmed ? appliedCode : null,
    acceptsMarketing: showMarketingOptIn && form.acceptsMarketing,
  })
  const formComplete = parsedForm.success && rates.some((rate) => rate.id === form.shippingRateId)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!parsedForm.success) return setErrors(zodFieldErrors(parsedForm.error))

    setErrors({})
    placeOrder.mutate(
      {
        ...parsedForm.data,
        lineItems: lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
        idempotencyKey,
      },
      {
        onError: (error) => {
          const rejected = error instanceof HttpError ? error.fieldErrors.discountCode : undefined
          if (rejected) rejectCode(rejected)
          handleMutationError(error, setErrors)
        },
      }
    )
  }

  if (!cartReady || placeOrder.isSuccess) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <Head title="Checkout" />
        <span className="grid size-12 place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
          <ShoppingBasket size={20} />
        </span>
        <p className="text-[16px] font-semibold">Your cart is empty</p>
        <p className="text-[14px] text-sf-muted">Add some products before checking out.</p>
        <Link route="home" className={cn(storefront.primaryButton, 'mt-1')}>
          Continue shopping
        </Link>
      </div>
    )
  }

  const paymentOptions: FormRadioCardOption[] = enabledMethods.map((method) =>
    method.code === 'stripe'
      ? {
          value: method.code,
          label: method.name,
          aside: <CreditCard size={20} className="text-sf-muted" />,
          content: (
            <p className="text-[13.5px] text-sf-muted">
              You’ll be taken to Stripe’s secure page to pay by card, Apple Pay or Google Pay, then
              brought back here.
            </p>
          ),
        }
      : method.code === 'poli'
        ? {
            value: method.code,
            label: method.name,
            aside: <Building2 size={20} className="text-sf-muted" />,
            content: (
              <p className="text-[13.5px] text-sf-muted">
                You’ll be taken to POLi to pay from your online banking, then brought back here.
              </p>
            ),
          }
        : {
            value: method.code,
            label: method.name,
            aside: <Landmark size={20} className="text-sf-muted" />,
            content: (
              <div className="flex flex-col gap-3">
                <p className="text-[13.5px] text-sf-muted">
                  After placing your order, transfer the total to the account below using the
                  reference we give you (HPDL followed by your order number). We’ll hold the order
                  until the payment arrives.
                </p>
                {method.bankTransfer && (
                  <BankDetails bank={method.bankTransfer} reference="Shown after you order" />
                )}
              </div>
            ),
          }
  )

  const recipientDetails = (
    <Subsection
      title="Recipient details"
      description="The person receiving the order at the delivery address."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput
          name="firstName"
          label="First name"
          required
          autoComplete="given-name"
          value={form.firstName}
          onChange={(event) => set('firstName', event.target.value)}
          error={errors.firstName}
        />
        <FormInput
          name="lastName"
          label="Last name"
          required
          autoComplete="family-name"
          value={form.lastName}
          onChange={(event) => set('lastName', event.target.value)}
          error={errors.lastName}
        />
      </div>
      <FormInput
        name="phone"
        type="tel"
        label="Phone"
        required
        tooltip="We use this number to reach the person receiving the order, so we can arrange the delivery with them."
        autoComplete="tel"
        value={form.phone}
        onChange={(event) => set('phone', event.target.value)}
        error={errors.phone}
      />
    </Subsection>
  )

  const newAddressFields = (
    <>
      <FormSelect
        name="countryCode"
        label="Choose the delivery country"
        required
        placeholder="Select a country"
        options={countryOptions}
        value={form.countryCode}
        onChange={(event) => changeCountry(event.target.value)}
        error={errors.countryCode}
      />
      {!countryChosen ? (
        <p className="text-[13px] text-sf-muted">
          Select a country in the list to enter your delivery address.
        </p>
      ) : (
        <>
          {!hasSavedAddresses && recipientDetails}
          <Subsection
            title={hasSavedAddresses ? 'New address' : 'Delivery address'}
            highlight={!hasSavedAddresses}
          >
            <FormAddressAutocomplete
              name="address1"
              label="Address"
              required
              value={form.address1}
              countryCode={form.countryCode}
              onChange={(value) => set('address1', value)}
              onSelect={(address) =>
                setForm((current) => {
                  const pickedCountry = address.countryCode ?? current.countryCode
                  return {
                    ...current,
                    address1: address.address1,
                    address2: address.address2 ?? address.suburb ?? current.address2,
                    city: address.city ?? '',
                    ...regionValueFor(pickedCountry, address.region),
                    postalCode: address.postalCode ?? '',
                    countryCode: pickedCountry,
                  }
                })
              }
              error={errors.address1}
            />
            <FormInput
              name="address2"
              label="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
              value={form.address2}
              onChange={(event) => set('address2', event.target.value)}
              error={errors.address2}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormInput
                name="city"
                label="City"
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={(event) => set('city', event.target.value)}
                error={errors.city}
              />
              <FormRegionField
                name="province"
                required
                countryCode={form.countryCode}
                value={{ province: form.province, regionCode: form.regionCode }}
                onChange={(region) =>
                  setForm((current) => ({ ...current, ...region, shippingRateId: null }))
                }
                error={errors.province}
              />
              <FormInput
                name="postalCode"
                label="Postal code"
                required
                autoComplete="postal-code"
                value={form.postalCode}
                onChange={(event) => set('postalCode', event.target.value)}
                error={errors.postalCode}
              />
            </div>
            {signedIn && (
              <FormSwitch
                name="saveAddress"
                label="Save this address for next time"
                tone="storefront"
                checked={form.saveAddress}
                onChange={(event) => set('saveAddress', event.target.checked)}
              />
            )}
          </Subsection>
        </>
      )}
    </>
  )

  return (
    <>
      <Head title="Checkout" />
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <details className="group border-b border-sf-line bg-sf-bg lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[14px] sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5 font-medium text-sf-primary">
              Order summary
              <ChevronDown
                size={16}
                className="transition-transform duration-200 group-open:rotate-180"
              />
            </span>
            <span className="text-[16px] font-semibold tabular-nums">
              {quote.data ? format(quote.data.total) : <Skeleton className="h-5 w-16" />}
            </span>
          </summary>
          <div className="px-4 pb-6 sm:px-6">{renderSummary('drawer')}</div>
        </details>

        <div className="flex justify-center px-4 py-8 sm:px-6 lg:justify-end lg:py-10 lg:pr-12">
          <form
            className="flex w-full max-w-[560px] min-w-0 flex-col gap-8"
            onSubmit={onSubmit}
            noValidate
          >
            <Link
              route="home"
              className="-mb-4 inline-flex items-center gap-1.5 self-start rounded text-[13.5px] font-medium text-sf-primary underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ArrowLeft size={15} /> Go back to shopping
            </Link>
            {(legacyLines.length > 0 || unavailable.length > 0 || lineErrors.length > 0) && (
              <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3 text-[13.5px]">
                <p className="font-medium text-danger">
                  Some items in your cart can’t be checked out. Remove them to continue.
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[...legacyLines, ...unavailable].map((line) => (
                    <li
                      key={String(line.product.id)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="min-w-0 truncate">{line.product.name}</span>
                      <button
                        type="button"
                        className={cn(storefront.iconButton, 'size-9 flex-none')}
                        onClick={() => removeItem(line.product.id)}
                        aria-label={`Remove ${line.product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
                {lineErrors.map(([key, message]) => (
                  <p key={key} className="text-danger">
                    {message}
                  </p>
                ))}
              </div>
            )}

            <Section title="Contact">
              {customer ? (
                <p className="rounded-lg bg-sf-bg px-4 py-3 text-[14px]">
                  Signed in as <span className="font-medium">{customer.email}</span>
                </p>
              ) : (
                <>
                  <FormInput
                    name="email"
                    type="email"
                    label="Email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => set('email', event.target.value)}
                    error={errors.email}
                  />
                  {!signedIn && (
                    <p className="text-[13px] text-sf-muted">
                      Have an account?{' '}
                      <Link
                        route="customers.session.create"
                        className="font-medium text-sf-primary underline-offset-2 hover:underline"
                      >
                        Sign in
                      </Link>
                    </p>
                  )}
                </>
              )}
              {showMarketingOptIn && (
                <FormSwitch
                  name="acceptsMarketing"
                  label={MARKETING_CONSENT_LABEL}
                  tone="storefront"
                  checked={form.acceptsMarketing}
                  onChange={(event) => set('acceptsMarketing', event.target.checked)}
                  error={errors.acceptsMarketing}
                />
              )}
            </Section>

            <section className="flex flex-col gap-3" aria-label="Delivery">
              <DeliveryHeader />
              {deliveryLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : hasSavedAddresses ? (
                <>
                  {recipientDetails}
                  <Subsection title="Delivery address" highlight>
                    <FormRadioCards
                      name="savedAddress"
                      legend="Ship to"
                      hideLegend
                      value={addressChoice}
                      onChange={chooseAddress}
                      error={
                        savedAddressIncomplete
                          ? 'This address is missing its province, region or postal code. Choose “Use a new address” to enter it in full.'
                          : usingSavedAddress
                            ? errors.countryCode
                            : undefined
                      }
                      options={[
                        ...savedAddresses.map((address) => ({
                          value: address.id,
                          label: <SavedAddressLabel address={address} />,
                          aside: address.isDefault ? (
                            <span className="text-[12.5px] text-sf-muted">Default</span>
                          ) : undefined,
                        })),
                        {
                          value: NEW_ADDRESS,
                          label: 'Use a new address',
                          content: <div className="flex flex-col gap-3">{newAddressFields}</div>,
                        },
                      ]}
                    />
                  </Subsection>
                </>
              ) : (
                newAddressFields
              )}
            </section>

            {addressReady && (
              <Section title="Shipping method">
                {quote.isLoading || (quote.isFetching && rates.length === 0) ? (
                  <Skeleton className="h-12 w-full" />
                ) : rates.length === 0 ? (
                  <Placeholder>We don’t ship to this address yet.</Placeholder>
                ) : (
                  <FormRadioCards
                    name="shippingRateId"
                    legend="Shipping method"
                    hideLegend
                    value={form.shippingRateId}
                    onChange={(value) => set('shippingRateId', value)}
                    options={rates.map((rate) => ({
                      value: rate.id,
                      label: (
                        <span className="flex min-w-0 flex-col">
                          <span>{rate.name}</span>
                          {rate.description && (
                            <span className="text-[12.5px] font-normal text-muted">
                              {rate.description}
                            </span>
                          )}
                        </span>
                      ),
                      aside: (
                        <span className="text-[14px] font-medium tabular-nums">
                          {rate.price === 0 ? 'Free' : format(rate.price)}
                        </span>
                      ),
                    }))}
                  />
                )}
                {errors.shippingRateId && (
                  <span className="text-[12.5px] text-danger">{errors.shippingRateId}</span>
                )}
              </Section>
            )}

            <Section title="Payment">
              {paymentMethods.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : paymentMethods.isError ? (
                <Placeholder>
                  We couldn’t load payment options.{' '}
                  <button
                    type="button"
                    className="font-medium text-sf-primary underline-offset-2 hover:underline"
                    onClick={() => paymentMethods.refetch()}
                  >
                    Try again
                  </button>
                </Placeholder>
              ) : paymentOptions.length === 0 ? (
                <Placeholder>Payment isn’t available yet. Please check back soon.</Placeholder>
              ) : (
                <FormRadioCards
                  name="paymentMethod"
                  legend="Payment method"
                  hideLegend
                  value={form.paymentMethod}
                  onChange={(value) => set('paymentMethod', value as PaymentMethod)}
                  options={paymentOptions}
                  error={errors.paymentMethod}
                />
              )}
            </Section>

            <FormButton
              block
              className="h-12 gap-2 text-[15px]"
              loading={placeOrder.isPending}
              loadingText="Processing…"
              disabled={
                !formComplete ||
                legacyLines.length > 0 ||
                unavailable.length > 0 ||
                lines.length === 0 ||
                enabledMethods.length === 0
              }
            >
              <Lock size={15} />{' '}
              {isOnlinePayment(form.paymentMethod) ? 'Pay now' : 'Complete order'}
            </FormButton>
            <RecaptchaNotice className="-mt-5 text-center text-sf-muted" />
          </form>
        </div>

        <aside
          className="hidden border-l border-sf-line bg-sf-bg lg:block"
          aria-label="Order summary"
        >
          <div className="sticky top-0 flex max-h-dvh w-full max-w-[460px] flex-col px-12 py-10">
            {renderSummary('sidebar')}
          </div>
        </aside>
      </div>
    </>
  )
}

CheckoutHome.layout = [CheckoutLayout]
