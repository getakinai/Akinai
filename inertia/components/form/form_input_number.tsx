import { useState, type InputHTMLAttributes } from 'react'
import { field } from '~/lib/styles'

type FormInputNumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'name' | 'type' | 'value' | 'onChange'
> & {
  name: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
  hint?: string
  error?: string
  hideLabel?: boolean
}

/**
 * Numeric input (prices, quantities, rates). Emits `null` for an empty
 * field instead of `NaN` or an empty string.
 */
export default function FormInputNumber({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  hideLabel = false,
  ...props
}: FormInputNumberProps) {
  const [draft, setDraft] = useState(value === null ? '' : String(value))

  const draftValue = draft.trim() === '' ? null : Number(draft)
  if (draftValue !== value) {
    setDraft(value === null ? '' : String(value))
  }

  return (
    <div className={field.wrapper}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        className={field.input}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={hint ? `${name}-hint` : undefined}
        value={draft}
        onChange={(event) => {
          const raw = event.target.value
          const trimmed = raw.trim()
          if (trimmed === '') {
            setDraft(raw)
            return onChange(null)
          }
          const parsed = Number(trimmed)
          if (Number.isNaN(parsed)) return
          setDraft(raw)
          onChange(parsed)
        }}
        {...props}
      />
      {hint && (
        <span id={`${name}-hint`} className="text-[12.5px] text-muted">
          {hint}
        </span>
      )}
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
