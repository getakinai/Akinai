import { useState, type ReactNode, type RefObject } from 'react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, X } from 'lucide-react'
import { FormCheckbox, FormInputNumber, FormSelectWithSearch, FormSwitch } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { formatMoney, type MoneyFormat } from '~/lib/money'
import {
  STOREFRONT_COLLECTION_SORTS,
  STOREFRONT_COLLECTION_SORT_LABELS,
  STOREFRONT_SORT_DIRECTION_LABELS,
  type SortDirection,
  type StorefrontCollectionSort,
} from '~/lib/storefront'
import { cn, storefront } from '~/lib/styles'
import type { CollectionFilters, StorefrontCollectionFacets, StorefrontFacetEntry } from '../_types'
import { activeFilterCount, EMPTY_FILTERS, toggleOptionValue, toggleValue } from './_filters'

type FilterSidebarProps = {
  titleId: string
  facets: StorefrontCollectionFacets | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  filters: CollectionFilters
  onChange: (filters: CollectionFilters) => void
  onClose: () => void
  closeRef?: RefObject<HTMLButtonElement | null>
  money: MoneyFormat
  sort: StorefrontCollectionSort
  direction: SortDirection
  onSortChange: (sort: StorefrontCollectionSort) => void
  onDirectionChange: (direction: SortDirection) => void
  sortDisabled: boolean
}

const SORT_OPTIONS = STOREFRONT_COLLECTION_SORTS.map((value) => ({
  value,
  label: STOREFRONT_COLLECTION_SORT_LABELS[value],
}))

const isSort = (value: string): value is StorefrontCollectionSort =>
  (STOREFRONT_COLLECTION_SORTS as readonly string[]).includes(value)

function SortControls({
  sort,
  direction,
  onSortChange,
  onDirectionChange,
  disabled,
}: {
  sort: StorefrontCollectionSort
  direction: SortDirection
  onSortChange: (sort: StorefrontCollectionSort) => void
  onDirectionChange: (direction: SortDirection) => void
  disabled: boolean
}) {
  const directionLabels = sort === 'featured' ? null : STOREFRONT_SORT_DIRECTION_LABELS[sort]
  const DirectionIcon = direction === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <FormSelectWithSearch
        name="collection-sort"
        label="Sort by"
        hideLabel
        searchPlaceholder="Search sorts…"
        options={SORT_OPTIONS}
        value={sort}
        disabled={disabled}
        showTriggerSubtitle={false}
        onChange={(next) => {
          if (isSort(next)) onSortChange(next)
        }}
      />
      <button
        type="button"
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sf-line bg-sf-surface px-3 text-[13.5px] font-medium text-sf-text transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || !directionLabels}
        onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
        aria-label={
          directionLabels ? `Sort direction: ${directionLabels[direction]}` : 'Sort direction'
        }
      >
        <DirectionIcon size={15} />
        {directionLabels?.[direction] ?? 'Order'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-sf-line px-4 py-4 first:border-t-0">
      <legend className="float-left mb-3 w-full text-[13px] font-semibold tracking-[0.02em] text-sf-text uppercase">
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function PriceSection({
  filters,
  onChange,
  range,
  money,
}: {
  filters: CollectionFilters
  onChange: (filters: CollectionFilters) => void
  range: StorefrontCollectionFacets['price']
  money: MoneyFormat
}) {
  const [min, setMin] = useState<number | null>(filters.priceMin ?? null)
  const [max, setMax] = useState<number | null>(filters.priceMax ?? null)

  const invalid = (min !== null && min < 0) || (max !== null && max < 0)
  const unchanged = min === (filters.priceMin ?? null) && max === (filters.priceMax ?? null)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (invalid) return
        const [low, high] = min !== null && max !== null && min > max ? [max, min] : [min, max]
        onChange({ ...filters, priceMin: low ?? undefined, priceMax: high ?? undefined })
      }}
    >
      {range.min !== null && range.max !== null && (
        <p className="text-[12.5px] text-sf-muted">
          {formatMoney(range.min, money)} – {formatMoney(range.max, money)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <FormInputNumber
          name="filter-price-min"
          label="Min"
          value={min}
          onChange={setMin}
          placeholder={range.min !== null ? String(Math.floor(range.min)) : '0'}
          error={min !== null && min < 0 ? 'Must be 0 or more' : undefined}
        />
        <FormInputNumber
          name="filter-price-max"
          label="Max"
          value={max}
          onChange={setMax}
          placeholder={range.max !== null ? String(Math.ceil(range.max)) : 'Any'}
          error={max !== null && max < 0 ? 'Must be 0 or more' : undefined}
        />
      </div>
      <button
        type="submit"
        className={cn(storefront.primaryButton, 'w-full disabled:opacity-50')}
        disabled={invalid || unchanged}
      >
        Apply price
      </button>
    </form>
  )
}

function EntryList({
  prefix,
  entries,
  selected,
  onToggle,
}: {
  prefix: string
  entries: StorefrontFacetEntry[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
      {entries.map((entry) => (
        <FormCheckbox
          key={entry.id}
          name={`${prefix}-${entry.id}`}
          label={`${entry.name} (${entry.count})`}
          checked={selected.includes(entry.id)}
          onChange={() => onToggle(entry.id)}
        />
      ))}
    </div>
  )
}

export default function FilterSidebar({
  titleId,
  facets,
  isLoading,
  isError,
  onRetry,
  filters,
  onChange,
  onClose,
  closeRef,
  money,
  sort,
  direction,
  onSortChange,
  onDirectionChange,
  sortDisabled,
}: FilterSidebarProps) {
  const active = activeFilterCount(filters)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 flex-none items-center justify-between gap-2 border-b border-sf-line px-4">
        <h2 id={titleId} className="truncate text-[15px] font-semibold">
          Filters{active > 0 && ` (${active})`}
        </h2>
        <button
          ref={closeRef}
          type="button"
          className={storefront.iconButton}
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Sort by">
          <SortControls
            sort={sort}
            direction={direction}
            onSortChange={onSortChange}
            onDirectionChange={onDirectionChange}
            disabled={sortDisabled}
          />
        </Section>

        {isLoading && (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        )}

        {isError && (
          <div className="p-4 text-center">
            <p className="text-[14px] text-sf-muted">We could not load the filters.</p>
            <button
              type="button"
              className={cn(storefront.primaryButton, 'mt-3')}
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        )}

        {facets && (
          <>
            <Section title="Availability">
              <FormSwitch
                name="filter-in-stock"
                label="In stock only"
                tone="storefront"
                checked={filters.inStock}
                onChange={(event) => onChange({ ...filters, inStock: event.target.checked })}
              />
            </Section>

            {facets.price.max !== null && (
              <Section title="Price">
                <PriceSection
                  key={`${filters.priceMin}-${filters.priceMax}`}
                  filters={filters}
                  onChange={onChange}
                  range={facets.price}
                  money={money}
                />
              </Section>
            )}

            {facets.vendors.length > 0 && (
              <Section title="Brand">
                <EntryList
                  prefix="filter-vendor"
                  entries={facets.vendors}
                  selected={filters.vendor}
                  onToggle={(id) =>
                    onChange({ ...filters, vendor: toggleValue(filters.vendor, id) })
                  }
                />
              </Section>
            )}

            {facets.productTypes.length > 0 && (
              <Section title="Product type">
                <EntryList
                  prefix="filter-type"
                  entries={facets.productTypes}
                  selected={filters.type}
                  onToggle={(id) => onChange({ ...filters, type: toggleValue(filters.type, id) })}
                />
              </Section>
            )}

            {facets.options.map((option, optionIndex) => (
              <Section key={option.name} title={option.name}>
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {option.values.map((value, valueIndex) => (
                    <FormCheckbox
                      key={value}
                      name={`filter-option-${optionIndex}-${valueIndex}`}
                      label={value}
                      checked={filters.options[option.name]?.includes(value) ?? false}
                      onChange={() =>
                        onChange({
                          ...filters,
                          options: toggleOptionValue(filters.options, option.name, value),
                        })
                      }
                    />
                  ))}
                </div>
              </Section>
            ))}
          </>
        )}
      </div>

      <div className="flex-none border-t border-sf-line p-4">
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-sf-line bg-sf-surface px-4 text-[14px] font-medium text-sf-text transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={active === 0}
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
