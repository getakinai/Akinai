import { type AdminCustomerSegment, type AdminCustomerSegmentFilters } from './_types'

export const EMPTY_SEGMENT_FILTERS: AdminCustomerSegmentFilters = {}

const nullToUndefined = <T>(value: T | null): T | undefined => (value === null ? undefined : value)

/** A saved segment's filters in the list's filter shape (nulls dropped). */
export function segmentToFilters(segment: AdminCustomerSegment): AdminCustomerSegmentFilters {
  const { filters } = segment
  return compactFilters({
    tags: filters.tags,
    marketing: nullToUndefined(filters.marketing),
    countryCode: nullToUndefined(filters.countryCode),
    ordersMin: nullToUndefined(filters.ordersMin),
    ordersMax: nullToUndefined(filters.ordersMax),
    spentCurrency: nullToUndefined(filters.spentCurrency),
    spentMin: nullToUndefined(filters.spentMin),
    spentMax: nullToUndefined(filters.spentMax),
    lastOrderFrom: nullToUndefined(filters.lastOrderFrom),
    lastOrderTo: nullToUndefined(filters.lastOrderTo),
  })
}

/** Drops unset values so two equal filter sets compare equal. */
export function compactFilters(filters: AdminCustomerSegmentFilters): AdminCustomerSegmentFilters {
  const spentSet = filters.spentMin !== undefined || filters.spentMax !== undefined
  const result: AdminCustomerSegmentFilters = {}
  if (filters.tags && filters.tags.length > 0) result.tags = [...filters.tags].sort()
  if (filters.marketing) result.marketing = filters.marketing
  if (filters.countryCode) result.countryCode = filters.countryCode
  if (filters.ordersMin !== undefined) result.ordersMin = filters.ordersMin
  if (filters.ordersMax !== undefined) result.ordersMax = filters.ordersMax
  if (spentSet && filters.spentCurrency) result.spentCurrency = filters.spentCurrency
  if (filters.spentMin !== undefined) result.spentMin = filters.spentMin
  if (filters.spentMax !== undefined) result.spentMax = filters.spentMax
  if (filters.lastOrderFrom) result.lastOrderFrom = filters.lastOrderFrom
  if (filters.lastOrderTo) result.lastOrderTo = filters.lastOrderTo
  return result
}

export function filtersEqual(a: AdminCustomerSegmentFilters, b: AdminCustomerSegmentFilters) {
  return JSON.stringify(compactFilters(a)) === JSON.stringify(compactFilters(b))
}

const range = (min: number | undefined, max: number | undefined, unit = '') => {
  if (min !== undefined && max !== undefined) return `${min}–${max}${unit}`
  if (min !== undefined) return `${min}+${unit}`
  return `up to ${max}${unit}`
}

/** Short labels for each active filter, for the chips above the list. */
export function describeFilters(
  filters: AdminCustomerSegmentFilters,
  countryName: (code: string) => string
): string[] {
  const labels: string[] = []
  if (filters.tags?.length) labels.push(`Tagged ${filters.tags.join(' or ')}`)
  if (filters.marketing) {
    labels.push(filters.marketing === 'subscribed' ? 'Subscribed' : 'Not subscribed')
  }
  if (filters.countryCode) labels.push(countryName(filters.countryCode))
  if (filters.ordersMin !== undefined || filters.ordersMax !== undefined) {
    labels.push(`Orders: ${range(filters.ordersMin, filters.ordersMax)}`)
  }
  if (filters.spentMin !== undefined || filters.spentMax !== undefined) {
    labels.push(
      `Spent: ${range(filters.spentMin, filters.spentMax)} ${filters.spentCurrency ?? ''}`.trim()
    )
  }
  if (filters.lastOrderFrom || filters.lastOrderTo) {
    labels.push(`Last order: ${filters.lastOrderFrom ?? '…'} to ${filters.lastOrderTo ?? 'today'}`)
  }
  return labels
}
