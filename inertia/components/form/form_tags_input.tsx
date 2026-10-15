import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import IconButton from '~/components/ui/icon_button'
import { cn, field } from '~/lib/styles'

type FormTagsInputProps = {
  name: string
  label: string
  values: string[]
  onChange: (values: string[]) => void
  suggestions?: string[]
  error?: string
  hint?: string
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

const normalize = (value: string) => value.trim().toLowerCase()

/**
 * Free-text tags shown as removable chips. Enter or comma adds the typed
 * tag; Backspace in an empty field removes the last one. Tags are
 * lowercased and de-duplicated.
 */
export default function FormTagsInput({
  name,
  label,
  values,
  onChange,
  suggestions = [],
  error,
  hint,
  disabled = false,
  placeholder = 'Add a tag and press Enter',
  maxLength = 40,
}: FormTagsInputProps) {
  const [draft, setDraft] = useState('')
  const listId = `${name}-suggestions`
  const selected = new Set(values)

  function commit(raw: string) {
    const added = raw
      .split(',')
      .map(normalize)
      .filter((tag) => tag.length > 0 && !selected.has(tag))
    if (added.length > 0) onChange([...values, ...new Set(added)])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className={field.wrapper}>
      <label className={field.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        autoComplete="off"
        list={suggestions.length > 0 ? listId : undefined}
        className={field.input}
        value={draft}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={hint ? `${name}-hint` : undefined}
        onChange={(event) => {
          const value = event.target.value
          if (value.includes(',')) commit(value)
          else setDraft(value)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions
            .filter((tag) => !selected.has(tag))
            .map((tag) => (
              <option key={tag} value={tag} />
            ))}
        </datalist>
      )}
      {hint && (
        <span id={`${name}-hint`} className="text-[12.5px] text-muted">
          {hint}
        </span>
      )}
      {error && <span className={field.error}>{error}</span>}
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={label}>
          {values.map((tag) => (
            <li
              key={tag}
              className={cn(
                'inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-md border border-line-2 bg-paper pl-2.5 text-[12.5px] text-ink',
                disabled ? 'pr-2.5' : 'pr-0.5'
              )}
            >
              <span className="truncate">{tag}</span>
              {!disabled && (
                <IconButton
                  label={`Remove ${tag}`}
                  size="sm"
                  className="size-6"
                  onClick={() => onChange(values.filter((entry) => entry !== tag))}
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
