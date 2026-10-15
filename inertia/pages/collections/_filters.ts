import type { CollectionFilters } from '../_types'

export const EMPTY_FILTERS: CollectionFilters = {
  vendor: [],
  type: [],
  options: {},
  inStock: false,
}

export function activeFilterCount(filters: CollectionFilters) {
  return (
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0) +
    filters.vendor.length +
    filters.type.length +
    Object.values(filters.options).reduce((total, values) => total + values.length, 0) +
    (filters.inStock ? 1 : 0)
  )
}

export function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

/** Adds or removes one option value, dropping the option once it has none left. */
export function toggleOptionValue(
  options: CollectionFilters['options'],
  name: string,
  value: string
): CollectionFilters['options'] {
  const values = toggleValue(options[name] ?? [], value)
  const rest = Object.fromEntries(Object.entries(options).filter(([key]) => key !== name))
  return values.length > 0 ? { ...rest, [name]: values } : rest
}
