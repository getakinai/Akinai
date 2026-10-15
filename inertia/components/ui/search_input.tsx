import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn, field } from '~/lib/styles'

type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  label: string
  value: string
  onDebouncedChange: (value: string) => void
  delay?: number
}

/**
 * Search field with a leading icon and a clear button. Keeps its own draft
 * value and reports it through `onDebouncedChange` once typing pauses for
 * `delay` ms. Clearing reports the empty value straight away.
 */
export default function SearchInput({
  label,
  value,
  onDebouncedChange,
  delay = 300,
  className,
  id,
  ...props
}: SearchInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onDebouncedChange(draft), delay)
    return () => clearTimeout(timer)
  }, [draft, value, delay, onDebouncedChange])

  const clear = () => {
    setDraft('')
    if (value !== '') onDebouncedChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative flex', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        className={cn(
          field.input,
          'h-[38px] w-full pl-9 text-[13.5px] [&::-webkit-search-cancel-button]:appearance-none',
          draft !== '' && 'pr-9'
        )}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        {...props}
      />
      {draft !== '' && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-subtle transition-colors duration-150 hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
