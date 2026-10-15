import dayjs, { type ConfigType } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import type { DateFormat } from '~/lib/store_settings'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

/** Social-feed style ages (`now`, `7m`, `8h`, `3d`). Registered locally, not as the default. */
const COMPACT_LOCALE = 'en-compact'
dayjs.locale(
  {
    ...dayjs.Ls.en,
    name: COMPACT_LOCALE,
    relativeTime: {
      future: '%s',
      past: '%s',
      s: 'now',
      m: '1m',
      mm: '%dm',
      h: '1h',
      hh: '%dh',
      d: '1d',
      dd: '%dd',
      M: '1mo',
      MM: '%dmo',
      y: '1y',
      yy: '%dy',
    },
  },
  undefined,
  true
)

export type DateInput = ConfigType

/** When the store settings API has not loaded yet. Matches server defaults. */
export const FALLBACK_DATE_CONTEXT = {
  timezone: 'Pacific/Auckland',
  locale: 'en-NZ',
  dateFormat: 'dd/MM/yyyy',
} as const satisfies DateFormatContext

export type DateFormatContext = {
  timezone: string
  locale: string
  dateFormat: DateFormat
}

export { dayjs }

export function dateContextFromStore(
  settings?: Pick<DateFormatContext, 'timezone' | 'locale' | 'dateFormat'> | null
): DateFormatContext {
  if (!settings) return { ...FALLBACK_DATE_CONTEXT }
  return {
    timezone: settings.timezone,
    locale: settings.locale,
    dateFormat: settings.dateFormat,
  }
}

function toDate(value: DateInput): Date {
  if (value instanceof Date) return value
  return new Date(value as string | number)
}

/**
 * Instants from the API are UTC (e.g. order placed Oct 9 08:00 NZ). We always
 * render them in the store time zone so staff in Manila and customers abroad
 * see the same wall clock as the business, not their laptop zone.
 */
export function zoned(value: DateInput, ctx: DateFormatContext) {
  return dayjs.utc(value).tz(ctx.timezone).locale(ctx.locale)
}

/** `5 minutes ago`, `in 2 days` (absolute; not tied to the browser clock zone). */
export function timeAgo(value: DateInput): string {
  return dayjs.utc(value).fromNow()
}

/** `now`, `7m`, `8h`, `3d`, `2mo`, `1y`. */
export function compactTimeAgo(value: DateInput): string {
  return dayjs.utc(value).locale(COMPACT_LOCALE).fromNow()
}

export function isToday(value: DateInput, ctx: DateFormatContext): boolean {
  const stamp = zoned(value, ctx).format('YYYY-MM-DD')
  const today = dayjs.utc().tz(ctx.timezone).format('YYYY-MM-DD')
  return stamp === today
}

/** True when `value` is strictly later than `other` (instant comparison). */
export function isAfter(value: DateInput, other: DateInput): boolean {
  return dayjs.utc(value).isAfter(dayjs.utc(other))
}

/** Calendar date in the account time zone, using the store date format. */
export function formatDate(value: DateInput, ctx: DateFormatContext): string {
  if (ctx.dateFormat === 'MMM d, yyyy') {
    return new Intl.DateTimeFormat(ctx.locale, {
      timeZone: ctx.timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(toDate(value))
  }
  const z = zoned(value, ctx)
  switch (ctx.dateFormat) {
    case 'dd/MM/yyyy':
      return z.format('DD/MM/YYYY')
    case 'MM/dd/yyyy':
      return z.format('MM/DD/YYYY')
    case 'yyyy-MM-dd':
      return z.format('YYYY-MM-DD')
    default:
      return z.format('DD/MM/YYYY')
  }
}

/** Date and time in the account time zone (store locale). */
export function formatDateTime(value: DateInput, ctx: DateFormatContext): string {
  return new Intl.DateTimeFormat(ctx.locale, {
    timeZone: ctx.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(toDate(value))
}

/** Time of day only, in the account time zone. */
export function formatTime(value: DateInput, ctx: DateFormatContext): string {
  return new Intl.DateTimeFormat(ctx.locale, {
    timeZone: ctx.timezone,
    timeStyle: 'short',
  }).format(toDate(value))
}

/** Long weekday date for headings, in the account time zone. */
export function formatLongDate(value: DateInput, ctx: DateFormatContext): string {
  return new Intl.DateTimeFormat(ctx.locale, {
    timeZone: ctx.timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(toDate(value))
}
