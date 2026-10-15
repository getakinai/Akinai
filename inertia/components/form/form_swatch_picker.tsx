import { Check } from 'lucide-react'
import { cn, field } from '~/lib/styles'

export type FormSwatchOption<T extends string> = {
  value: T
  label: string
  /** Background and text classes for the swatch, e.g. `bg-red-600 text-white`. */
  className: string
}

type FormSwatchPickerProps<T extends string> = {
  name: string
  legend: string
  options: readonly FormSwatchOption<T>[]
  value: T
  onChange: (value: T) => void
  error?: string
  disabled?: boolean
}

/**
 * Picks one color from a fixed palette, shown as round swatches (a radio
 * group, so arrow keys move between colors).
 */
export default function FormSwatchPicker<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: FormSwatchPickerProps<T>) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <fieldset className={field.wrapper} disabled={disabled} aria-describedby={errorId}>
      <legend className={cn(field.label, 'mb-1.5')}>{legend}</legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const id = `${name}-${option.value}`
          const checked = option.value === value
          return (
            <label
              key={option.value}
              htmlFor={id}
              title={option.label}
              className={cn(
                'relative flex size-9 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow duration-150 has-focus-visible:ring-3 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-55',
                option.className,
                checked ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line-2'
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="sr-only">{option.label}</span>
              {checked && <Check size={16} strokeWidth={3} aria-hidden="true" />}
            </label>
          )
        })}
      </div>
      {error && (
        <span id={errorId} className={field.error}>
          {error}
        </span>
      )}
    </fieldset>
  )
}
