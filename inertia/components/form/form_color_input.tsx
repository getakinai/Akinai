import { cn, field } from '~/lib/styles'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

type FormColorInputProps = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  disabled?: boolean
}

/**
 * A color swatch picker next to a hex text field. Both edit the same
 * `#rrggbb` value; the swatch keeps its last valid color while the text is
 * being typed.
 */
export default function FormColorInput({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  disabled,
}: FormColorInputProps) {
  const swatch = HEX_COLOR.test(value) ? value.toLowerCase() : '#000000'
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined

  return (
    <div className={field.wrapper}>
      <label className={field.label} htmlFor={name}>
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={swatch}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 flex-none cursor-pointer rounded-lg border border-line-2 bg-field p-1 disabled:cursor-not-allowed disabled:opacity-55 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          id={name}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value.trim()
            onChange(next.startsWith('#') || next === '' ? next : `#${next}`)
          }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(field.input, 'w-full min-w-0 font-mono text-[13px] uppercase')}
        />
      </div>
      {hint && (
        <span id={hintId} className="text-[12.5px] text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={field.error}>
          {error}
        </span>
      )}
    </div>
  )
}
