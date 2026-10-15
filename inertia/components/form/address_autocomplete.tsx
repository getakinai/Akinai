import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  PLACES_DEBOUNCE_MS,
  PLACES_MIN_CHARS,
  createPlacesSessionToken,
  fetchPlacesAutocomplete,
  fetchPlacesDetails,
  type PlaceAddress,
  type PlaceSuggestion,
} from '~/lib/places'
import { cn, field } from '~/lib/styles'
import RequiredMark from './required_mark'

type FormAddressAutocompleteProps = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  /** Called with the Google address once a suggestion is picked. */
  onSelect: (address: PlaceAddress) => void
  /** ISO 3166-1 alpha-2 code that suggestions are limited to. */
  countryCode?: string | null
  error?: string
  hideLabel?: boolean
  required?: boolean
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  autoComplete?: string
  autoFocus?: boolean
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export default function FormAddressAutocomplete({
  name,
  label,
  value,
  onChange,
  onSelect,
  countryCode,
  error,
  hideLabel = false,
  required = false,
  placeholder,
  disabled = false,
  maxLength,
  autoComplete = 'off',
  autoFocus,
}: FormAddressAutocompleteProps) {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionTokenRef = useRef<string | null>(null)
  const lastQueryRef = useRef('')
  /** Only fetch after the user types; prefill and programmatic updates are ignored. */
  const userTypedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  /** A modal `<dialog>` makes the rest of the page inert, so the list must render inside it. */
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const sessionToken = () => {
    sessionTokenRef.current ??= createPlacesSessionToken()
    return sessionTokenRef.current
  }

  const updatePosition = () => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPortalTarget(el.closest('dialog') ?? document.body)
    setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }

  const closeMenu = () => {
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed.length < PLACES_MIN_CHARS || !userTypedRef.current) {
      abortRef.current?.abort()
      closeMenu()
      setIsLoading(false)
      lastQueryRef.current = trimmed
      return
    }
    if (trimmed === lastQueryRef.current) return

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current
      lastQueryRef.current = trimmed
      setIsLoading(true)

      try {
        const results = await fetchPlacesAutocomplete(
          trimmed,
          sessionToken(),
          countryCode,
          controller.signal
        )
        if (requestId !== requestIdRef.current || !userTypedRef.current) return
        setSuggestions(results)
        setActiveIndex(results.length > 0 ? 0 : -1)
        setOpen(results.length > 0)
        if (results.length > 0) updatePosition()
      } catch (err) {
        if (isAbortError(err) || requestId !== requestIdRef.current) return
        closeMenu()
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false)
      }
    }, PLACES_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [value, countryCode])

  useEffect(() => {
    if (!open) return

    const onReposition = () => updatePosition()
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (inputRef.current?.contains(target)) return
      if (document.getElementById(listboxId)?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, listboxId])

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    abortRef.current?.abort()
    requestIdRef.current += 1
    userTypedRef.current = false
    closeMenu()
    setIsLoading(true)

    const address = await fetchPlacesDetails(suggestion.placeId, sessionToken())
    sessionTokenRef.current = null
    setIsLoading(false)

    if (!address) {
      lastQueryRef.current = value.trim()
      return
    }

    const line1 = address.address1 || suggestion.mainText
    lastQueryRef.current = line1.trim()
    onChange(line1)
    onSelect({ ...address, address1: line1 })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    } else if (event.key === 'Enter' && suggestions[activeIndex]) {
      event.preventDefault()
      void selectSuggestion(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  const menu =
    open && suggestions.length > 0 && portalTarget
      ? createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="fixed z-50 box-border max-h-60 min-w-0 overflow-y-auto overscroll-contain rounded-lg border border-line-2 bg-card py-1 shadow-lg"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {suggestions.map((suggestion, index) => {
              const isActive = index === activeIndex
              return (
                <li
                  key={suggestion.placeId}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={cn(
                      'block w-full cursor-pointer border-0 px-3 py-2.5 text-left text-[13.5px] transition-colors',
                      isActive ? 'bg-paper text-ink' : 'bg-card text-ink-2 hover:bg-paper'
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void selectSuggestion(suggestion)}
                  >
                    {suggestion.description}
                  </button>
                </li>
              )
            })}
          </ul>,
          portalTarget
        )
      : null

  return (
    <div className={field.wrapper}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={name}>
        {label}
        {required && <RequiredMark />}
      </label>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="text"
        role="combobox"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required || undefined}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        className={field.input}
        onChange={(event) => {
          userTypedRef.current = true
          onChange(event.target.value)
        }}
        onFocus={() => {
          if (userTypedRef.current && suggestions.length > 0) {
            updatePosition()
            setOpen(true)
          }
        }}
        onBlur={() => {
          userTypedRef.current = false
          abortRef.current?.abort()
          setOpen(false)
          setIsLoading(false)
        }}
        onKeyDown={onKeyDown}
      />
      <span className="sr-only" aria-live="polite">
        {isLoading ? 'Searching addresses' : ''}
      </span>
      {isLoading && <span className="text-[12.5px] text-muted">Searching…</span>}
      {error && <span className={field.error}>{error}</span>}
      {menu}
    </div>
  )
}
