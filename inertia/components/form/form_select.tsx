import { type ChangeEvent } from 'react'
import type { SelectOption } from '~/components/ui/select'
import FormSelectWithSearch from './form_select_with_search'

type FormSelectProps = {
  name: string
  label: string
  options: SelectOption[]
  value?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  error?: string
  hideLabel?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  compact?: boolean
}

/** Labelled select with search — wraps `FormSelectWithSearch` for the legacy event API. */
export default function FormSelect({
  name,
  label,
  options,
  value = '',
  onChange,
  placeholder,
  ...props
}: FormSelectProps) {
  const emptyOption = options.find((option) => option.value === '')
  const selectable = options.filter((option) => option.value !== '')

  return (
    <FormSelectWithSearch
      name={name}
      label={label}
      value={value}
      options={selectable}
      placeholder={placeholder ?? emptyOption?.label ?? 'Select an option'}
      onChange={(next) =>
        onChange?.({ target: { value: next, name } } as ChangeEvent<HTMLSelectElement>)
      }
      {...props}
    />
  )
}
