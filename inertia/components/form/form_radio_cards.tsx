import { type ReactNode } from 'react'
import { cn, field } from '~/lib/styles'

export type FormRadioCardOption = {
  value: string
  label: ReactNode
  /** Shown on the right of the row, e.g. a price or an icon. */
  aside?: ReactNode
  /** Revealed under the row while the option is selected. */
  content?: ReactNode
}

type FormRadioCardsProps = {
  name: string
  legend: string
  options: FormRadioCardOption[]
  value: string | null
  onChange: (value: string) => void
  error?: string
  hideLegend?: boolean
}

/**
 * Stacked, joined radio rows (shipping methods, payment methods). The
 * selected row is highlighted and shows its `content` panel.
 */
export default function FormRadioCards({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  hideLegend = false,
}: FormRadioCardsProps) {
  return (
    <fieldset className={field.wrapper}>
      <legend className={hideLegend ? 'sr-only' : cn(field.label, 'mb-1.5')}>{legend}</legend>
      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-lg border border-line-2 bg-field',
          error && 'border-danger'
        )}
      >
        {options.map((option, index) => {
          const id = `${name}-${option.value}`
          const checked = option.value === value
          return (
            <div key={option.value} className={cn(index > 0 && 'border-t border-line-2')}>
              <label
                htmlFor={id}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-[14px] transition-colors duration-150',
                  checked ? 'bg-accent-soft' : 'hover:bg-paper'
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="size-4 flex-none cursor-pointer accent-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                />
                <span className="min-w-0 flex-1 font-medium">{option.label}</span>
                {option.aside && <span className="flex-none text-ink">{option.aside}</span>}
              </label>
              {checked && option.content && (
                <div className="border-t border-line-2 bg-paper px-4 py-4">{option.content}</div>
              )}
            </div>
          )
        })}
      </div>
      {error && <span className={field.error}>{error}</span>}
    </fieldset>
  )
}
