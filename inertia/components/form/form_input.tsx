import { type InputHTMLAttributes, type ReactNode } from 'react'
import InfoTooltip from '~/components/ui/info_tooltip'
import { cn, field } from '~/lib/styles'
import RequiredMark from './required_mark'

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> & {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'url'
  error?: string
  hideLabel?: boolean
  /** Extra help shown in an info tooltip next to the label. */
  tooltip?: ReactNode
}

export default function FormInput({
  name,
  label,
  type = 'text',
  error,
  hideLabel = false,
  tooltip,
  required,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className={field.wrapper}>
      {tooltip && !hideLabel ? (
        <div className="relative flex items-center gap-1">
          <label className={field.label} htmlFor={name}>
            {label}
            {required && <RequiredMark />}
          </label>
          <InfoTooltip label={`About ${label.toLowerCase()}`}>{tooltip}</InfoTooltip>
        </div>
      ) : (
        <label className={hideLabel ? 'sr-only' : field.label} htmlFor={name}>
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={cn(field.input, className)}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required || undefined}
        {...props}
      />
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
