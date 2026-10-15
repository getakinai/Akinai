import { X } from 'lucide-react'
import { formatMoney, type MoneyFormat } from '~/lib/money'
import type { CollectionFilters, StorefrontCollectionFacets } from '../_types'
import { EMPTY_FILTERS, toggleOptionValue } from './_filters'

type Chip = { key: string; label: string; next: CollectionFilters }

function priceLabel(filters: CollectionFilters, money: MoneyFormat) {
  const { priceMin: min, priceMax: max } = filters
  if (min !== undefined && max !== undefined) {
    return `${formatMoney(min, money)} – ${formatMoney(max, money)}`
  }
  if (min !== undefined) return `From ${formatMoney(min, money)}`
  return `Up to ${formatMoney(max ?? 0, money)}`
}

function chipsFor(
  filters: CollectionFilters,
  facets: StorefrontCollectionFacets | undefined,
  money: MoneyFormat
): Chip[] {
  const nameOf = (entries: { id: string; name: string }[] | undefined, id: string) =>
    entries?.find((entry) => entry.id === id)?.name ?? 'Selected'

  const chips: Chip[] = []
  if (filters.inStock) {
    chips.push({ key: 'in-stock', label: 'In stock', next: { ...filters, inStock: false } })
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    chips.push({
      key: 'price',
      label: priceLabel(filters, money),
      next: { ...filters, priceMin: undefined, priceMax: undefined },
    })
  }
  for (const id of filters.vendor) {
    chips.push({
      key: `vendor-${id}`,
      label: nameOf(facets?.vendors, id),
      next: { ...filters, vendor: filters.vendor.filter((item) => item !== id) },
    })
  }
  for (const id of filters.type) {
    chips.push({
      key: `type-${id}`,
      label: nameOf(facets?.productTypes, id),
      next: { ...filters, type: filters.type.filter((item) => item !== id) },
    })
  }
  for (const [name, values] of Object.entries(filters.options)) {
    for (const value of values) {
      chips.push({
        key: `option-${name}-${value}`,
        label: `${name}: ${value}`,
        next: { ...filters, options: toggleOptionValue(filters.options, name, value) },
      })
    }
  }
  return chips
}

export default function ActiveFilters({
  filters,
  facets,
  money,
  onChange,
}: {
  filters: CollectionFilters
  facets: StorefrontCollectionFacets | undefined
  money: MoneyFormat
  onChange: (filters: CollectionFilters) => void
}) {
  const chips = chipsFor(filters, facets, money)
  if (chips.length === 0) return null

  return (
    <ul aria-label="Active filters" className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key} className="min-w-0">
          <button
            type="button"
            className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-sf-line bg-sf-surface px-3 text-[13px] text-sf-text transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            onClick={() => onChange(chip.next)}
            aria-label={`Remove filter ${chip.label}`}
          >
            <span className="truncate">{chip.label}</span>
            <X size={13} className="flex-none" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          className="h-8 px-2 text-[13px] font-medium text-sf-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Clear all
        </button>
      </li>
    </ul>
  )
}
