import { FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { type FulfillmentTrackingPayload } from './_types'

export type TrackingDraft = { trackingCompany: string; trackingNumber: string; trackingUrl: string }

export function trackingDraft(
  tracking?: Partial<FulfillmentTrackingPayload> | null
): TrackingDraft {
  return {
    trackingCompany: tracking?.trackingCompany ?? '',
    trackingNumber: tracking?.trackingNumber ?? '',
    trackingUrl: tracking?.trackingUrl ?? '',
  }
}

export function trackingPayload(draft: TrackingDraft): FulfillmentTrackingPayload {
  return {
    trackingCompany: draft.trackingCompany.trim() || null,
    trackingNumber: draft.trackingNumber.trim() || null,
    trackingUrl: draft.trackingUrl.trim() || null,
  }
}

type TrackingFieldsProps = {
  value: TrackingDraft
  onChange: (value: TrackingDraft) => void
  errors: FieldErrors
  disabled?: boolean
}

export default function TrackingFields({ value, onChange, errors, disabled }: TrackingFieldsProps) {
  const set = (key: keyof TrackingDraft) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: event.target.value })

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormInput
        name="trackingCompany"
        label="Carrier"
        placeholder="e.g. LBC, J&T Express"
        maxLength={100}
        value={value.trackingCompany}
        disabled={disabled}
        error={errors.trackingCompany}
        onChange={set('trackingCompany')}
      />
      <FormInput
        name="trackingNumber"
        label="Tracking number"
        maxLength={100}
        value={value.trackingNumber}
        disabled={disabled}
        error={errors.trackingNumber}
        onChange={set('trackingNumber')}
      />
      <div className="sm:col-span-2">
        <FormInput
          name="trackingUrl"
          label="Tracking URL"
          type="url"
          placeholder="https://"
          maxLength={2048}
          value={value.trackingUrl}
          disabled={disabled}
          error={errors.trackingUrl}
          onChange={set('trackingUrl')}
        />
      </div>
    </div>
  )
}
