import { type ChangeEvent } from 'react'
import { FileText, Upload } from 'lucide-react'
import { buttonClasses, cn, field } from '~/lib/styles'

type FormFileInputProps = {
  name: string
  label: string
  file: File | null
  accept?: string
  hint?: string
  chooseLabel?: string
  disabled?: boolean
  error?: string
  onSelect: (file: File | null) => void
}

const filePickerFocus =
  'cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring has-[:disabled]:pointer-events-none has-[:disabled]:opacity-45'

/**
 * Single file picker that shows the chosen file name. Reading or uploading
 * the file is up to the caller.
 */
export default function FormFileInput({
  name,
  label,
  file,
  accept,
  hint,
  chooseLabel = 'Choose file',
  disabled = false,
  error,
  onSelect,
}: FormFileInputProps) {
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    onSelect(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  return (
    <div className={field.wrapper}>
      <span className={field.label}>{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <label
          className={cn(buttonClasses({ variant: 'secondary', size: 'sm' }), filePickerFocus)}
          htmlFor={name}
        >
          <Upload size={14} />
          {file ? 'Replace' : chooseLabel}
          <input
            id={name}
            name={name}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled}
            onChange={onChange}
            aria-invalid={error ? 'true' : 'false'}
          />
        </label>
        {file && (
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-2">
            <FileText size={14} className="flex-none" />
            <span className="truncate">{file.name}</span>
          </span>
        )}
      </div>
      {hint && <span className="text-[12.5px] text-muted">{hint}</span>}
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
