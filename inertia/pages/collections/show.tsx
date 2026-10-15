import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ChevronRight, LayoutGrid, List, Loader2, SlidersHorizontal } from 'lucide-react'
import { type ProductCardLayout } from '~/components/storefront'
import { Skeleton } from '~/components/ui'
import { useProductView } from '~/hooks/use_product_view'
import StorefrontLayout from '~/layouts/storefront'
import { HttpError } from '~/lib/http'
import {
  STOREFRONT_SORT_DEFAULT_DIRECTION,
  type SortDirection,
  type StorefrontCollectionSort,
} from '~/lib/storefront'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { cn, storefront } from '~/lib/styles'
import {
  COLLECTION_DEFAULT_LIST,
  useStoreMoney,
  useStorefrontCollection,
  useStorefrontCollectionFilters,
  useStorefrontCollectionProducts,
} from '../_hooks'
import ProductGrid, { ProductGridSkeleton } from '../_product_grid'
import type { CollectionFilters, StorefrontPrefetchProps } from '../_types'
import ActiveFilters from './_active_filters'
import FilterSidebar from './_filter_sidebar'
import { activeFilterCount, EMPTY_FILTERS } from './_filters'

const VIEW_OPTIONS: { value: ProductCardLayout; label: string; Icon: typeof LayoutGrid }[] = [
  { value: 'grid', label: 'Grid', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
]

const FILTERS_ID = 'collection-filters'
const FILTERS_TITLE_ID = 'collection-filters-title'

/** Matches Tailwind's `lg`, where the filters sit beside the grid instead of in a drawer. */
const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether the viewport is `lg` or wider. The server render assumes desktop. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  )
}

function Toolbar({
  view,
  onViewChange,
  filtersOpen,
  filterCount,
  onFiltersToggle,
}: {
  view: ProductCardLayout
  onViewChange: (view: ProductCardLayout) => void
  filtersOpen: boolean
  filterCount: number
  onFiltersToggle: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
      <button
        type="button"
        aria-expanded={filtersOpen}
        aria-controls={FILTERS_ID}
        onClick={onFiltersToggle}
        className={cn(
          'relative inline-flex h-10 items-center gap-1.5 rounded-lg border border-sf-line px-3 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
          filtersOpen
            ? 'bg-sf-primary text-sf-primary-fg'
            : 'bg-sf-surface text-sf-text hover:bg-sf-primary-soft'
        )}
      >
        <SlidersHorizontal size={15} />
        Filters
        {filterCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sf-accent px-1 text-[11px] font-semibold text-sf-text tabular-nums">
            {filterCount}
          </span>
        )}
      </button>

      <div
        role="group"
        aria-label="Product layout"
        className="inline-flex rounded-lg border border-sf-line bg-sf-surface p-0.5"
      >
        {VIEW_OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => onViewChange(value)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
              view === value
                ? 'bg-sf-primary text-sf-primary-fg'
                : 'text-sf-text hover:bg-sf-primary-soft'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function NotAvailable() {
  return (
    <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
      <p className="text-[16px] font-semibold">This collection is not available</p>
      <p className="mt-1 text-[14px] text-sf-muted">
        It may have been moved or is no longer listed.
      </p>
      <Link route="home" className={cn(storefront.primaryButton, 'mt-4')}>
        Back to shop
      </Link>
    </div>
  )
}

export default function CollectionShow({ slug }: StorefrontPrefetchProps & { slug: string }) {
  const [view, setView] = useProductView()
  const [sort, setSort] = useState<StorefrontCollectionSort>(COLLECTION_DEFAULT_LIST.sort)
  const [direction, setDirection] = useState<SortDirection>(COLLECTION_DEFAULT_LIST.direction)
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS)
  /** `null` until the shopper toggles: open on desktop, closed on mobile, decided by CSS. */
  const [filtersOpen, setFiltersOpen] = useState<boolean | null>(null)
  const isDesktop = useIsDesktop()
  const closeFiltersRef = useRef<HTMLButtonElement>(null)
  const focusFilters = useRef(false)
  const money = useStoreMoney()

  const collectionQuery = useStorefrontCollection(slug)
  const productsQuery = useStorefrontCollectionProducts(slug, { sort, direction, filters })
  const filtersQuery = useStorefrontCollectionFilters(slug, {
    enabled: filtersOpen !== false || activeFilterCount(filters) > 0,
  })
  const desktopFiltersOpen = filtersOpen ?? true
  const gridColumns = desktopFiltersOpen ? 3 : 4
  const collection = collectionQuery.data
  const notFound =
    (collectionQuery.error instanceof HttpError && collectionQuery.error.status === 404) ||
    (productsQuery.error instanceof HttpError && productsQuery.error.status === 404)

  const pages = productsQuery.data?.pages ?? []
  const products = pages.flatMap((page) => page.data)
  const total = pages[0]?.metadata.total
  const resorting = productsQuery.isPlaceholderData
  const filterCount = activeFilterCount(filters)

  useEffect(() => {
    if (filtersOpen !== true) return
    if (focusFilters.current) {
      focusFilters.current = false
      closeFiltersRef.current?.focus()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !window.matchMedia(DESKTOP_QUERY).matches) {
        setFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtersOpen])

  const toggleFilters = () => {
    const next = !(filtersOpen ?? isDesktop)
    focusFilters.current = next
    setFiltersOpen(next)
  }

  return (
    <>
      <Head title={collection?.title ?? 'Collection'} />
      <div className={cn(storefront.container, 'pb-4')}>
        <nav aria-label="Breadcrumb" className="mt-5 sm:mt-7">
          <ol className="flex min-w-0 items-center gap-1 text-[13px] text-sf-muted">
            <li>
              <Link route="home" className="hover:text-sf-text hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="flex-none">
              <ChevronRight size={14} />
            </li>
            <li className="min-w-0 truncate text-sf-text" aria-current="page">
              {collection?.title ??
                (collectionQuery.isLoading ? <Skeleton className="h-3.5 w-32" /> : 'Collection')}
            </li>
          </ol>
        </nav>

        {notFound ? (
          <NotAvailable />
        ) : (
          <>
            <header className="mt-3 mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:gap-8">
              <div className="min-w-0 flex-1">
                {collectionQuery.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="mt-3 h-4 w-80 max-w-full" />
                  </>
                ) : (
                  collection && (
                    <>
                      <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] sm:text-[32px]">
                        {collection.title}
                      </h1>
                      {collection.description && (
                        <div
                          className={cn(storefront.richText, 'mt-2 max-w-2xl text-[14.5px]')}
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(collection.description) }}
                        />
                      )}
                    </>
                  )
                )}
              </div>
              {total !== undefined ? (
                <p className="flex flex-none flex-col items-end text-right">
                  <span className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-sf-text tabular-nums sm:text-[40px]">
                    {total}
                  </span>
                  <span className="mt-1 text-[12.5px] text-sf-muted sm:text-[13.5px]">
                    {total === 1 ? 'product' : 'products'}
                  </span>
                </p>
              ) : (
                <Skeleton className="h-10 w-12 flex-none sm:h-12 sm:w-16" />
              )}
            </header>

            <Toolbar
              view={view}
              onViewChange={setView}
              filtersOpen={filtersOpen ?? isDesktop}
              filterCount={filterCount}
              onFiltersToggle={toggleFilters}
            />

            <div
              className={cn(
                desktopFiltersOpen &&
                  'lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6'
              )}
            >
              {filtersOpen === true && (
                <button
                  type="button"
                  aria-label="Close filters"
                  tabIndex={-1}
                  className="fixed inset-0 z-30 bg-sf-text/30 backdrop-blur-[2px] lg:hidden"
                  onClick={() => setFiltersOpen(false)}
                />
              )}
              <aside
                id={FILTERS_ID}
                aria-labelledby={FILTERS_TITLE_ID}
                aria-hidden={filtersOpen === false}
                inert={filtersOpen === false}
                className={cn(
                  'fixed inset-y-0 left-0 z-40 flex w-[min(320px,100vw)] flex-col border-r border-sf-line bg-sf-surface text-sf-text transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                  'lg:sticky lg:top-[calc(var(--sf-header-height,8.5rem)+1.25rem)] lg:z-auto lg:max-h-[calc(100dvh-var(--sf-header-height,8.5rem)-2.5rem)] lg:w-auto lg:translate-x-0 lg:rounded-card lg:border lg:transition-none',
                  filtersOpen === true && 'translate-x-0',
                  filtersOpen === false && '-translate-x-full lg:hidden',
                  filtersOpen === null && '-translate-x-full'
                )}
              >
                <FilterSidebar
                  titleId={FILTERS_TITLE_ID}
                  facets={filtersQuery.data}
                  isLoading={filtersQuery.isLoading}
                  isError={filtersQuery.isError}
                  onRetry={() => filtersQuery.refetch()}
                  filters={filters}
                  onChange={setFilters}
                  onClose={() => setFiltersOpen(false)}
                  closeRef={closeFiltersRef}
                  money={money}
                  sort={sort}
                  direction={direction}
                  onSortChange={(next) => {
                    setSort(next)
                    setDirection(STOREFRONT_SORT_DEFAULT_DIRECTION[next])
                  }}
                  onDirectionChange={setDirection}
                  sortDisabled={productsQuery.isLoading}
                />
              </aside>

              <div className="min-w-0">
                <ActiveFilters
                  filters={filters}
                  facets={filtersQuery.data}
                  money={money}
                  onChange={setFilters}
                />

                {productsQuery.isLoading && (
                  <ProductGridSkeleton count={8} layout={view} columns={gridColumns} />
                )}

                {productsQuery.isError && !notFound && (
                  <div className={cn(storefront.card, 'p-8 text-center')}>
                    <p className="text-[15px] font-medium">
                      We could not load the products right now.
                    </p>
                    <button
                      type="button"
                      className={cn(storefront.primaryButton, 'mt-4')}
                      onClick={() => productsQuery.refetch()}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {productsQuery.isSuccess && products.length === 0 && filterCount > 0 && (
                  <div className={cn(storefront.card, 'p-8 text-center')}>
                    <p className="text-[16px] font-semibold">No products match these filters</p>
                    <p className="mt-1 text-[14px] text-sf-muted">
                      Try removing a filter or widening the price range.
                    </p>
                    <button
                      type="button"
                      className={cn(storefront.primaryButton, 'mt-4')}
                      onClick={() => setFilters(EMPTY_FILTERS)}
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                {productsQuery.isSuccess && products.length === 0 && filterCount === 0 && (
                  <div className={cn(storefront.card, 'p-8 text-center')}>
                    <p className="text-[16px] font-semibold">No products here yet</p>
                    <p className="mt-1 text-[14px] text-sf-muted">
                      Check back soon for fresh picks in this collection.
                    </p>
                  </div>
                )}

                {products.length > 0 && (
                  <div
                    aria-busy={resorting}
                    className={cn('transition-opacity duration-150', resorting && 'opacity-60')}
                  >
                    <ProductGrid
                      products={products}
                      money={money}
                      layout={view}
                      columns={gridColumns}
                      collectionSlug={slug}
                    />
                  </div>
                )}

                {productsQuery.hasNextPage && !resorting && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      className={cn(storefront.primaryButton, 'w-full sm:w-auto sm:min-w-48')}
                      onClick={() => productsQuery.fetchNextPage()}
                      disabled={productsQuery.isFetchingNextPage}
                    >
                      {productsQuery.isFetchingNextPage ? (
                        <>
                          <Loader2 size={16} className="motion-safe:animate-spin" /> Loading
                        </>
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

CollectionShow.layout = [StorefrontLayout]
