import { X } from 'lucide-react'
import IconButton from '~/components/ui/icon_button'
import { cn, field } from '~/lib/styles'
import FormSelectWithSearch, { type FormSelectWithSearchOption } from './form_select_with_search'

type FormMultiSelectProps = {
  name: string
  label: string
  options: FormSelectWithSearchOption[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  emptyText?: string
  /** Extra classes for the chip list, e.g. a max height for long selections. */
  listClassName?: string
}

/**
 * Searchable picker that adds values to a list shown as removable chips.
 */
export default function FormMultiSelect({
  name,
  label,
  options,
  values,
  onChange,
  error,
  disabled = false,
  placeholder = 'Add…',
  emptyText = 'Nothing selected yet.',
  listClassName,
}: FormMultiSelectProps) {
  const selected = new Set(values)
  const labels = new Map(options.map((option) => [option.value, option.label]))

  return (
    <div className={field.wrapper}>
      <FormSelectWithSearch
        name={name}
        label={label}
        value=""
        placeholder={placeholder}
        disabled={disabled}
        options={options.filter((option) => !selected.has(option.value))}
        onChange={(value) => {
          if (value && !selected.has(value)) onChange([...values, value])
        }}
        error={error}
      />
      {values.length === 0 ? (
        <p className="text-[13px] text-muted">{emptyText}</p>
      ) : (
        <ul className={cn('flex flex-wrap gap-1.5', listClassName)} aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-md border border-line-2 bg-paper pr-0.5 pl-2.5 text-[12.5px] text-ink"
            >
              <span className="truncate">{labels.get(value) ?? value}</span>
              {!disabled && (
                <IconButton
                  label={`Remove ${labels.get(value) ?? value}`}
                  size="sm"
                  className="size-6"
                  onClick={() => onChange(values.filter((entry) => entry !== value))}
                >
                  <X size={12} />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
