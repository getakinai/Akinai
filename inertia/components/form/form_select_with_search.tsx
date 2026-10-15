import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import Badge from '~/components/ui/badge'
import IconButton from '~/components/ui/icon_button'
import InfoTooltip from '~/components/ui/info_tooltip'
import { cn, field, type BadgeTone } from '~/lib/styles'
import RequiredMark from './required_mark'

export type FormSelectWithSearchOption = {
  label: string
  value: string
  /** Extra text matched by the built-in filter (defaults to `label`). */
  searchText?: string
  subtitle?: string
  disabled?: boolean
  icon?: ReactNode
  badge?: { label: string; tone?: BadgeTone }
}

export type FormSelectWithSearchProps = {
  name: string
  label: string
  options: FormSelectWithSearchOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  hideLabel?: boolean
  /** Extra help shown in an info tooltip next to the label. */
  tooltip?: ReactNode
  required?: boolean
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  noOptionsText?: string
  loadingText?: string
  isLoading?: boolean
  /** Tailwind max-height class for the options list. */
  maxHeightClass?: string
  /** Called when the user types in the dropdown search field. */
  onSearch?: (searchTerm: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  clearable?: boolean
  /** Show subtitle on the closed trigger as well as in the list. */
  showTriggerSubtitle?: boolean
  className?: string
  triggerClassName?: string
  /** Minimum dropdown width in px when wider than the trigger. */
  dropdownMinWidth?: number
  /** Match toolbar `Select` height (34px). */
  compact?: boolean
}

function filterOptions(options: FormSelectWithSearchOption[], searchTerm: string) {
  if (!searchTerm.trim()) return options
  const query = searchTerm.trim().toLowerCase()
  return options.filter((option) => {
    const haystack = option.searchText ?? option.label
    return (
      haystack.toLowerCase().includes(query) ||
      (option.subtitle?.toLowerCase().includes(query) ?? false)
    )
  })
}

export default function FormSelectWithSearch({
  name,
  label,
  options,
  value,
  onChange,
  error,
  hideLabel = false,
  tooltip,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  noOptionsText = 'No options found',
  loadingText = 'Loading…',
  isLoading = false,
  maxHeightClass = 'max-h-60',
  onSearch,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  clearable = false,
  showTriggerSubtitle = true,
  className,
  triggerClassName,
  dropdownMinWidth,
  compact = false,
}: FormSelectWithSearchProps) {
  const listboxId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsListRef = useRef<HTMLDivElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  /** A modal `<dialog>` makes the rest of the page inert, so the list must render inside it. */
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const selectedOption = options.find((option) => option.value === value)
  const filteredOptions = useMemo(
    () => (onSearch ? options : filterOptions(options, searchTerm)),
    [options, searchTerm, onSearch]
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
    onSearch?.('')
  }, [onSearch])

  const updateDropdownPosition = useCallback(() => {
    const triggerEl = triggerRef.current
    if (!triggerEl) return
    const rect = triggerEl.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width || triggerEl.offsetWidth,
    })
  }, [])

  const openDropdown = () => {
    if (disabled || isLoading) return
    setPortalTarget(triggerRef.current?.closest('dialog') ?? document.body)
    updateDropdownPosition()
    setIsOpen(true)
  }

  const handleClear = (event: ReactMouseEvent) => {
    event.stopPropagation()
    onChange('')
    close()
  }

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    close()
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value
    setSearchTerm(term)
    onSearch?.(term)
  }

  const handleOptionsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore || !onLoadMore) return
    const element = event.currentTarget
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
    if (distanceFromBottom <= 24) onLoadMore()
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      close()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()
    searchInputRef.current?.focus()
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    if (!isOpen || searchTerm) return

    let cancelled = false
    const scrollToSelected = () => {
      const listEl = optionsListRef.current
      const optionEl = selectedOptionRef.current
      if (!listEl || !optionEl) return
      const listRect = listEl.getBoundingClientRect()
      const optionRect = optionEl.getBoundingClientRect()
      listEl.scrollTop +=
        optionRect.top - listRect.top - listEl.clientHeight / 2 + optionRect.height / 2
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) scrollToSelected()
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [isOpen, searchTerm, value])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const handleReposition = () => updateDropdownPosition()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [isOpen, close, updateDropdownPosition])

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={cn(
            'fixed z-50 box-border flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-line-2 bg-card shadow-lg',
            maxHeightClass
          )}
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(dropdownPosition.width, dropdownMinWidth ?? 0),
          }}
        >
          <div className="w-full min-w-0 shrink-0 border-b border-line p-2">
            <div className="relative block w-full min-w-0">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 z-[1] -translate-y-1/2 text-subtle"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className={cn(
                  field.input,
                  'box-border block h-9 w-full min-w-0 max-w-full pl-9 text-[13.5px]'
                )}
                aria-label={searchPlaceholder}
              />
            </div>
          </div>

          <div
            ref={optionsListRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            onScroll={handleOptionsScroll}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    ref={isSelected ? selectedOptionRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={cn(
                      'w-full border-0 px-3 py-2.5 text-left text-[13.5px] transition-colors',
                      isSelected ? 'bg-accent-soft text-ink' : 'bg-card text-ink-2',
                      option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-paper'
                    )}
                    onClick={() => !option.disabled && handleOptionSelect(option.value)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium">
                        {option.icon && <span className="shrink-0 text-muted">{option.icon}</span>}
                        {option.label}
                      </span>
                      {option.badge && (
                        <Badge tone={option.badge.tone ?? 'neutral'} className="shrink-0">
                          {option.badge.label}
                        </Badge>
                      )}
                    </div>
                    {option.subtitle && (
                      <p className="mt-0.5 truncate text-[12px] text-muted">{option.subtitle}</p>
                    )}
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-3 text-[13.5px] text-muted">
                {isLoading ? loadingText : noOptionsText}
              </p>
            )}
            {isLoadingMore && (
              <p className="px-3 py-2 text-center text-[13px] text-muted">{loadingText}</p>
            )}
          </div>
        </div>,
        portalTarget ?? document.body
      )
    : null

  const triggerLabel = selectedOption?.label ?? (isLoading ? loadingText : placeholder)
  const showClear = clearable && Boolean(selectedOption) && !disabled

  return (
    <div className={cn(field.wrapper, className)}>
      {tooltip && !hideLabel ? (
        <div className="relative flex items-center gap-1">
          <label className={field.label} htmlFor={`${name}-trigger`}>
            {label}
            {required && <RequiredMark />}
          </label>
          <InfoTooltip label={`About ${label.toLowerCase()}`}>{tooltip}</InfoTooltip>
        </div>
      ) : (
        <label className={hideLabel ? 'sr-only' : field.label} htmlFor={`${name}-trigger`}>
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <button
          id={`${name}-trigger`}
          ref={triggerRef}
          type="button"
          disabled={disabled || isLoading}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required || undefined}
          className={cn(
            field.input,
            'flex w-full items-center gap-2 py-2 pr-2 pl-3 text-left',
            compact ? 'min-h-[34px] h-[34px] py-0 text-[12.5px]' : 'h-auto min-h-10 text-[14px]',
            !selectedOption && 'text-subtle',
            error && 'border-danger',
            triggerClassName
          )}
          onClick={() => (isOpen ? close() : openDropdown())}
        >
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                {selectedOption?.icon && (
                  <span className="shrink-0 text-muted">{selectedOption.icon}</span>
                )}
                {triggerLabel}
              </span>
              {selectedOption?.badge && (
                <Badge tone={selectedOption.badge.tone ?? 'neutral'} className="shrink-0">
                  {selectedOption.badge.label}
                </Badge>
              )}
            </span>
            {showTriggerSubtitle && selectedOption?.subtitle && (
              <span className="truncate text-[12px] text-muted">{selectedOption.subtitle}</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            {showClear && <span aria-hidden="true" className="size-7 shrink-0" />}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn('shrink-0 text-subtle transition-transform', isOpen && 'rotate-180')}
            />
          </span>
        </button>
        {showClear && (
          <span className="absolute top-1/2 right-[26px] flex -translate-y-1/2">
            <IconButton label="Clear selection" size="sm" className="size-7" onClick={handleClear}>
              <X size={14} />
            </IconButton>
          </span>
        )}
        {dropdown}
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
