import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInputNumber, FormSelect, FormSelectWithSearch } from '~/components/form'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { CURRENCY_OPTIONS } from '~/lib/currencies'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { formatMoney, formatStoreDate } from '~/lib/money'
import {
  CURRENCY_DISPLAY_LABELS,
  CURRENCY_DISPLAYS,
  DATE_FORMATS,
  LOCALE_OPTIONS,
  TIMEZONE_OPTIONS,
  UNIT_SYSTEM_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  type CurrencyDisplay,
  type DateFormat,
  type UnitSystem,
  type WeightUnit,
} from '~/lib/store_settings'
import { useUpdateAdminStoreDefaults } from './_hooks'
import { AdminStoreDefaultsFormSchema, type AdminStoreSettings } from './_types'

const SAMPLE_AMOUNT = 1234.56

const DEFAULT_WEIGHT_UNIT: Record<UnitSystem, WeightUnit> = { metric: 'kg', imperial: 'lb' }

const hint = 'text-[12.5px] text-muted'

type DefaultsFormProps = {
  settings: AdminStoreSettings
  disabled: boolean
}

/**
 * Currency, formatting, time zone and units. Remount with a new `key` to
 * reset the fields.
 */
export default function DefaultsForm({ settings, disabled }: DefaultsFormProps) {
  const [operatingCountryCode, setOperatingCountryCode] = useState(
    settings.operatingCountryCode ?? ''
  )
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode)
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>(settings.currencyDisplay)
  const [locale, setLocale] = useState(settings.locale)
  const [dateFormat, setDateFormat] = useState<DateFormat>(settings.dateFormat)
  const [timezone, setTimezone] = useState(settings.timezone)
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(settings.unitSystem)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(settings.weightUnit)
  const [returnWindowDays, setReturnWindowDays] = useState<number | null>(settings.returnWindowDays)
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateDefaults = useUpdateAdminStoreDefaults()

  const currencyDisplayOptions = useMemo(
    () =>
      CURRENCY_DISPLAYS.map((value) => ({
        value,
        label: `${CURRENCY_DISPLAY_LABELS[value]} · ${formatMoney(SAMPLE_AMOUNT, {
          currencyCode,
          currencyDisplay: value,
          locale,
        })}`,
      })),
    [currencyCode, locale]
  )

  const dateFormatOptions = useMemo(() => {
    const today = new Date()
    return DATE_FORMATS.map((value) => ({
      value,
      label: `${formatStoreDate(today, value, locale, timezone)} (${value})`,
    }))
  }, [locale, timezone])

  const isDirty =
    operatingCountryCode !== (settings.operatingCountryCode ?? '') ||
    currencyCode !== settings.currencyCode ||
    currencyDisplay !== settings.currencyDisplay ||
    locale !== settings.locale ||
    dateFormat !== settings.dateFormat ||
    timezone !== settings.timezone ||
    unitSystem !== settings.unitSystem ||
    weightUnit !== settings.weightUnit ||
    returnWindowDays !== settings.returnWindowDays

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreDefaultsFormSchema.safeParse({
      operatingCountryCode: operatingCountryCode || null,
      currencyCode,
      currencyDisplay,
      locale,
      dateFormat,
      timezone,
      unitSystem,
      weightUnit,
      returnWindowDays,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateDefaults.mutate(parsed.data, {
      onSuccess: () => toast.success('Store defaults saved'),
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectWithSearch
          name="operatingCountryCode"
          label="Default country you deliver to"
          placeholder="Not set"
          searchPlaceholder="Search countries"
          tooltip="Tailors examples and suggestions, such as province groups for shipping zones. Changing it doesn't add or remove markets or zones."
          options={COUNTRY_OPTIONS}
          value={operatingCountryCode}
          clearable
          disabled={disabled}
          onChange={setOperatingCountryCode}
          error={errors.operatingCountryCode}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FormSelectWithSearch
            name="currencyCode"
            label="Store currency"
            options={CURRENCY_OPTIONS}
            value={currencyCode}
            disabled={disabled}
            onChange={setCurrencyCode}
            error={errors.currencyCode}
          />
          <p className={hint}>
            The currency products are priced in. Markets can show other currencies.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <FormSelect
            name="currencyDisplay"
            label="Currency format"
            options={currencyDisplayOptions}
            value={currencyDisplay}
            disabled={disabled}
            onChange={(event) => setCurrencyDisplay(event.target.value as CurrencyDisplay)}
            error={errors.currencyDisplay}
          />
          <p className={hint}>
            Preview:{' '}
            <span className="font-medium text-ink">
              {formatMoney(SAMPLE_AMOUNT, { currencyCode, currencyDisplay, locale })}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            name="locale"
            label="Language and region format"
            options={LOCALE_OPTIONS}
            value={locale}
            disabled={disabled}
            onChange={(event) => setLocale(event.target.value)}
            error={errors.locale}
          />
          <p className={hint}>Sets number separators and month names on the storefront.</p>
        </div>
        <FormSelect
          name="dateFormat"
          label="Date format"
          options={dateFormatOptions}
          value={dateFormat}
          disabled={disabled}
          onChange={(event) => setDateFormat(event.target.value as DateFormat)}
          error={errors.dateFormat}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          name="unitSystem"
          label="Unit system"
          options={UNIT_SYSTEM_OPTIONS}
          value={unitSystem}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value as UnitSystem
            setUnitSystem(next)
            setWeightUnit(DEFAULT_WEIGHT_UNIT[next])
          }}
          error={errors.unitSystem}
        />
        <FormSelect
          name="weightUnit"
          label="Default weight unit"
          options={WEIGHT_UNIT_OPTIONS}
          value={weightUnit}
          disabled={disabled}
          onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
          error={errors.weightUnit}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FormSelectWithSearch
          name="timezone"
          label="Time zone"
          options={TIMEZONE_OPTIONS}
          value={timezone}
          disabled={disabled}
          onChange={setTimezone}
          error={errors.timezone}
        />
        <p className={hint}>Sets the time for when orders and analytics are recorded.</p>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-[50%]">
        <FormInputNumber
          name="returnWindowDays"
          label="Return window (days)"
          value={returnWindowDays}
          disabled={disabled}
          onChange={setReturnWindowDays}
          error={errors.returnWindowDays}
        />
        <p className={hint}>
          How long after delivery customers can request a return from their account. Use 0 to turn
          customer return requests off.
        </p>
      </div>

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-line pt-4">
          <FormButton size="sm" disabled={!isDirty} loading={updateDefaults.isPending}>
            Save
          </FormButton>
        </div>
      )}
    </form>
  )
}
