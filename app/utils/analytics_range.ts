import { DateTime } from 'luxon'
import {
  ANALYTICS_DEFAULT_RANGE_DAYS,
  ANALYTICS_MAX_RANGE_DAYS,
  type AnalyticsCompare,
  type AnalyticsGrain,
} from '#constants/analytics'

export type AnalyticsRange = {
  /** First day, at midnight in the store timezone. */
  from: DateTime
  /** Exclusive end: midnight after the last day. */
  end: DateTime
  days: number
  compare: AnalyticsCompare
  grain: AnalyticsGrain
  previousFrom: DateTime | null
  previousEnd: DateTime | null
}

export type AnalyticsRangeInput = { from?: string; to?: string; compare?: AnalyticsCompare }

export function grainFor(days: number): AnalyticsGrain {
  if (days <= 2) return 'hour'
  if (days <= 90) return 'day'
  if (days <= 366) return 'week'
  return 'month'
}

/**
 * Turns the validated query into store-timezone days. Defaults to the last
 * 30 days against the previous 30; swaps a reversed range and caps it at
 * two years.
 */
export function resolveAnalyticsRange(
  input: AnalyticsRangeInput,
  timezone: string,
  now: DateTime = DateTime.now()
): AnalyticsRange {
  const today = now.setZone(timezone).startOf('day')
  const parse = (value: string | undefined) => {
    if (!value) return null
    const date = DateTime.fromISO(value, { zone: timezone })
    return date.isValid ? date.startOf('day') : null
  }

  let last = parse(input.to) ?? today
  let from = parse(input.from) ?? last.minus({ days: ANALYTICS_DEFAULT_RANGE_DAYS - 1 })
  if (from > last) [from, last] = [last, from]
  if (last.diff(from, 'days').days > ANALYTICS_MAX_RANGE_DAYS - 1) {
    from = last.minus({ days: ANALYTICS_MAX_RANGE_DAYS - 1 })
  }

  const end = last.plus({ days: 1 })
  const days = Math.round(end.diff(from, 'days').days)
  const compare = input.compare ?? 'previous_period'

  let previousFrom: DateTime | null = null
  let previousEnd: DateTime | null = null
  if (compare === 'previous_period') {
    previousFrom = from.minus({ days })
    previousEnd = from
  } else if (compare === 'previous_year') {
    previousFrom = from.minus({ years: 1 })
    previousEnd = end.minus({ years: 1 })
  }

  return { from, end, days, compare, grain: grainFor(days), previousFrom, previousEnd }
}

/** Bucket key; matches the repositories' `to_char(date_trunc(...), 'YYYY-MM-DD"T"HH24:MI')`. */
export function bucketKey(start: DateTime): string {
  return start.toFormat("yyyy-MM-dd'T'HH:mm")
}

export function bucketStarts(from: DateTime, end: DateTime, grain: AnalyticsGrain): DateTime[] {
  const starts: DateTime[] = []
  let cursor = from.startOf(grain)
  while (cursor < end) {
    starts.push(cursor)
    cursor = cursor.plus({ [`${grain}s`]: 1 })
  }
  return starts
}

export function bucketLabel(start: DateTime, grain: AnalyticsGrain, days: number): string {
  if (grain === 'hour') return start.toFormat(days > 1 ? 'ccc HH:mm' : 'HH:mm')
  if (grain === 'month') return start.toFormat('LLL yyyy')
  return start.toFormat('d LLL')
}
