import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { format, isValid, parseISO, startOfDay } from 'date-fns'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { DateRange, type RangeKeyDict } from 'react-date-range'
import IconButton from '~/components/ui/icon_button'
import { cn, field } from '~/lib/styles'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

export const DATE_RANGE_CALENDAR_EARLIEST_YEAR = 2020

/**
 * Space kept between the popover and the viewport edge. The popover opens
 * from the trigger's left edge when it fits, otherwise from its right edge.
 */
const VIEWPORT_GUTTER = 8

export type DateRangeValue = {
  startDate: Date
  endDate: Date
}

type DateRangeCalendarPickerProps = {
  name: string
  label: string
  hideLabel?: boolean
  error?: string
  /** Controlled range. When null/undefined, shows the placeholder. */
  value?: DateRangeValue | null
  onChange: (range: DateRangeValue) => void
  /** Shows a clear button while a value is set. */
  onClear?: () => void
  clearLabel?: string
  placeholder?: string
  /** Overrides the trigger text built from `value`. */
  valueLabel?: string
  minDate?: Date
  maxDate?: Date
  className?: string
  disabled?: boolean
  /** Match toolbar filter height (34px). */
  compact?: boolean
  /** Close the popover once a multi-day range is selected. */
  closeOnSelect?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Months shown side by side from the `md` breakpoint. */
  months?: number
}

export function formatDateRangeDisplay(start: Date, end: Date): string {
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMM d')} – ${format(end, 'd')}, ${format(end, 'yyyy')}`
    }
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}, ${format(end, 'yyyy')}`
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

function parseYmd(value: string): Date | null {
  const parsed = parseISO(value)
  return isValid(parsed) ? startOfDay(parsed) : null
}

export function formatDateRangeToYmd(range: DateRangeValue): { dateFrom: string; dateTo: string } {
  return {
    dateFrom: format(range.startDate, 'yyyy-MM-dd'),
    dateTo: format(range.endDate, 'yyyy-MM-dd'),
  }
}

export function parseDateRangeFromYmd(
  dateFrom?: string | null,
  dateTo?: string | null
): DateRangeValue | null {
  if (!dateFrom || !dateTo) return null
  const startDate = parseYmd(dateFrom)
  const endDate = parseYmd(dateTo)
  if (!startDate || !endDate) return null
  return { startDate, endDate }
}

/**
 * Date range field: a trigger styled like the other form inputs that opens a
 * react-date-range calendar. Colours come from the app theme variables, so
 * it follows the light/dark toggle (see `.app-date-range` in app.css).
 */
export default function DateRangeCalendarPicker({
  name,
  label,
  hideLabel = false,
  error,
  value,
  onChange,
  onClear,
  clearLabel = 'Clear dates',
  placeholder = 'All dates',
  valueLabel,
  minDate = new Date(DATE_RANGE_CALENDAR_EARLIEST_YEAR, 0, 1),
  maxDate = new Date(),
  className,
  disabled = false,
  compact = false,
  closeOnSelect = false,
  open,
  onOpenChange,
  months = 1,
}: DateRangeCalendarPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen

  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const today = startOfDay(new Date())
  const activeRange = value ?? { startDate: today, endDate: today }
  const ranges = [{ ...activeRange, key: 'selection' }]
  const displayLabel =
    valueLabel ?? (value ? formatDateRangeDisplay(value.startDate, value.endDate) : placeholder)

  useLayoutEffect(() => {
    const popover = popoverRef.current
    const anchor = containerRef.current
    if (!isOpen || !popover || !anchor) return
    if (window.getComputedStyle(popover).position === 'fixed') return
    const fitsRight =
      anchor.getBoundingClientRect().left + popover.offsetWidth <=
      document.documentElement.clientWidth - VIEWPORT_GUTTER
    popover.dataset.align = fitsRight ? 'start' : 'end'
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setIsOpen])

  const handleRangeChange = (item: RangeKeyDict) => {
    const { startDate, endDate } = item.selection ?? {}
    if (!startDate || !endDate) return

    const latest = startOfDay(maxDate)
    onChange({
      startDate: startOfDay(startDate),
      endDate: endDate.getTime() > latest.getTime() ? latest : startOfDay(endDate),
    })

    if (closeOnSelect && startDate.getTime() !== endDate.getTime()) setIsOpen(false)
  }

  const calendarProps = {
    onChange: handleRangeChange,
    moveRangeOnFirstSelection: false,
    ranges,
    showMonthAndYearPickers: true,
    showDateDisplay: false,
    minDate,
    maxDate,
    color: 'var(--accent)',
    rangeColors: ['var(--accent)'],
  }

  return (
    <div className={cn(field.wrapper, className)}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={`${name}-trigger`}>
        {label}
      </label>
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-2">
          <button
            id={`${name}-trigger`}
            type="button"
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-invalid={error ? 'true' : 'false'}
            className={cn(
              field.input,
              'flex w-full min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-55',
              compact && 'h-[34px] text-[12.5px]',
              !value && !valueLabel && 'text-subtle',
              error && 'border-danger'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn('shrink-0 text-subtle transition-transform', isOpen && 'rotate-180')}
            />
          </button>
          {value && onClear && !disabled && (
            <IconButton label={clearLabel} className="size-10 shrink-0" onClick={onClear}>
              <X size={15} />
            </IconButton>
          )}
        </div>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={label}
              className="app-date-range fixed inset-x-4 top-20 z-50 max-h-[80vh] overflow-auto rounded-card border border-line-2 bg-card p-1 shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-none sm:w-max sm:max-w-[calc(100vw-2rem)] sm:data-[align=start]:right-auto sm:data-[align=start]:left-0"
            >
              <div className="hidden md:block">
                <DateRange {...calendarProps} months={months} direction="horizontal" />
              </div>
              <div className="md:hidden">
                <DateRange {...calendarProps} months={1} direction="vertical" />
              </div>
            </div>
          </>
        )}
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
