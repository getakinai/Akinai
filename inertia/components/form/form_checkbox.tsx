import Checkbox, { type CheckboxProps } from '~/components/ui/checkbox'
import { field } from '~/lib/styles'

type FormCheckboxProps = Omit<CheckboxProps, 'id' | 'name'> & {
  name: string
  label: string
  error?: string
}

export default function FormCheckbox({ name, label, error, ...props }: FormCheckboxProps) {
  return (
    <div className={field.wrapper}>
      <label className="inline-flex items-center gap-2 text-[13.5px] text-ink" htmlFor={name}>
        <Checkbox id={name} name={name} aria-invalid={error ? 'true' : 'false'} {...props} />
        {label}
      </label>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
