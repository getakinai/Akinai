import { type TextareaHTMLAttributes } from 'react'
import { cn, field } from '~/lib/styles'

type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> & {
  name: string
  label: string
  error?: string
  hideLabel?: boolean
}

export default function FormTextarea({
  name,
  label,
  error,
  rows = 5,
  hideLabel = false,
  ...props
}: FormTextareaProps) {
  return (
    <div className={field.wrapper}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className={cn(field.input, 'h-auto resize-y py-2.5 leading-[1.5]')}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
