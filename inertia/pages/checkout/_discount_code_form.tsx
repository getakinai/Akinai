import { type FormEvent } from 'react'
import { Tag, X } from 'lucide-react'
import { FormButton, FormInput } from '~/components/form'
import { cn, storefront } from '~/lib/styles'
import { MAX_DISCOUNT_CODE_LENGTH } from './_types'

export type DiscountCodeFormProps = {
  /** Unique per instance; the summary renders twice (mobile and desktop). */
  name: string
  value: string
  applied: string | null
  error?: string
  pending: boolean
  onChange: (value: string) => void
  onApply: () => void
  onRemove: () => void
}

export default function DiscountCodeForm({
  name,
  value,
  applied,
  error,
  pending,
  onChange,
  onApply,
  onRemove,
}: DiscountCodeFormProps) {
  function onSubmit(event: FormEvent) {
    event.preventDefault()
    onApply()
  }

  if (applied) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-sf-line bg-sf-surface px-3 py-2 text-[14px]">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Tag size={14} className="flex-none text-sf-primary" />
          <span className="truncate font-medium">{applied}</span>
        </span>
        <button
          type="button"
          className={cn(storefront.iconButton, 'size-9 flex-none')}
          onClick={onRemove}
          aria-label={`Remove discount code ${applied}`}
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <form className="flex min-w-0 items-start gap-2" onSubmit={onSubmit} noValidate>
      <div className="min-w-0 flex-1">
        <FormInput
          name={name}
          label="Discount code"
          hideLabel
          placeholder="Discount code"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={MAX_DISCOUNT_CODE_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={error}
        />
      </div>
      <FormButton
        variant="secondary"
        className="flex-none"
        loading={pending}
        loadingText="Applying…"
        disabled={value.trim() === ''}
      >
        Apply
      </FormButton>
    </form>
  )
}
