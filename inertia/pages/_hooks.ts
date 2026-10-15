import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { catalogHttp } from '~/lib/catalog_http'
import { http, HttpError, redirectResponseSchema } from '~/lib/http'
import { FALLBACK_MONEY, type MoneyFormat } from '~/lib/money'
import { toQueryString } from '~/lib/query_string'
import { recaptchaHeaders, type RecaptchaAction } from '~/lib/recaptcha'
import type { SortDirection, StorefrontCollectionSort } from '~/lib/storefront'
import { checkoutKeys } from '~/pages/checkout/_hooks'
import { EMPTY_FILTERS } from '~/pages/collections/_filters'
import { pluginRegistry } from '~/plugins/registry'
import {
  NewsletterResponseSchema,
  type NewsletterForm,
  StoreSettingsResponseSchema,
  StorefrontCartPricesResponseSchema,
  type CollectionFilters,
  StorefrontCollectionFiltersResponseSchema,
  StorefrontCollectionProductsResponseSchema,
  StorefrontCollectionResponseSchema,
  StorefrontHomeContentResponseSchema,
  StorefrontHomeResponseSchema,
  StorefrontMarketResponseSchema,
  StorefrontMarketUpdateSchema,
  type StorefrontMarketUpdate,
  StorefrontMenuResponseSchema,
  StorefrontPageResponseSchema,
  StorefrontPluginsResponseSchema,
  StorefrontPoliciesResponseSchema,
  StorefrontPrefetchSchema,
  StorefrontProductResponseSchema,
  StorefrontSearchResponseSchema,
  StorefrontSessionResponseSchema,
  StorefrontThemeResponseSchema,
} from './_types'

/** Shorter queries are not sent; they match too much to be useful. */
export const STOREFRONT_SEARCH_MIN_LENGTH = 2

export const storeSettingsKeys = {
  all: ['store', 'settings'] as const,
}

export const storefrontKeys = {
  all: ['store', 'storefront'] as const,
  theme: ['store', 'storefront', 'theme'] as const,
  menu: ['store', 'storefront', 'menu'] as const,
  home: ['store', 'storefront', 'home'] as const,
  plugins: ['store', 'storefront', 'plugins'] as const,
  heroSlides: ['store', 'storefront', 'hero-slides'] as const,
  homeContent: ['store', 'storefront', 'home-content'] as const,
  search: (q: string) => ['store', 'storefront', 'search', q] as const,
  collection: (slug: string) => ['store', 'storefront', 'collections', slug] as const,
  collectionProducts: (
    slug: string,
    sort: StorefrontCollectionSort,
    direction: SortDirection,
    filters: CollectionFilters
  ) => ['store', 'storefront', 'collections', slug, 'products', sort, direction, filters] as const,
  collectionFilters: (slug: string) =>
    ['store', 'storefront', 'collections', slug, 'filters'] as const,
  product: (slug: string) => ['store', 'storefront', 'products', slug] as const,
  page: (slug: string) => ['store', 'storefront', 'pages', slug] as const,
  policies: ['store', 'storefront', 'policies'] as const,
  session: ['store', 'session'] as const,
  market: ['store', 'market'] as const,
}

/** The order the collection page opens with; the server prefetches this list. */
export const COLLECTION_DEFAULT_LIST = { sort: 'featured', direction: 'asc' } as const

/**
 * Fills the query cache from the `prefetch` prop of a server-rendered
 * storefront page before the app renders, so the server render and the
 * hydrating client show the same data. Invalid payloads are skipped and the
 * page fetches as usual.
 */
export function seedStorefrontQueries(queryClient: QueryClient, props: Record<string, unknown>) {
  if (props.prefetch === null || props.prefetch === undefined) return
  const parsed = StorefrontPrefetchSchema.safeParse(props.prefetch)
  if (!parsed.success) {
    console.warn('Ignoring an invalid storefront prefetch payload', parsed.error)
    return
  }

  const data = parsed.data
  const slug = typeof props.slug === 'string' ? props.slug : null
  queryClient.setQueryData(storeSettingsKeys.all, data.settings)
  queryClient.setQueryData(storefrontKeys.theme, data.theme)
  queryClient.setQueryData(storefrontKeys.menu, data.menu)
  queryClient.setQueryData(storefrontKeys.policies, data.policies)
  queryClient.setQueryData(storefrontKeys.market, data.market)
  queryClient.setQueryData(storefrontKeys.plugins, data.plugins)
  for (const plugin of data.plugins) {
    const entry = pluginRegistry[plugin.key]
    if (entry?.seedQueries && plugin.data !== undefined) {
      entry.seedQueries(queryClient, plugin.data)
    }
  }
  if (data.home) queryClient.setQueryData(storefrontKeys.home, data.home)
  if (data.homeContent) queryClient.setQueryData(storefrontKeys.homeContent, data.homeContent)
  if (!slug) return

  if (data.product) queryClient.setQueryData(storefrontKeys.product(slug), data.product)
  if (data.page) queryClient.setQueryData(storefrontKeys.page(slug), data.page)
  if (data.collection) queryClient.setQueryData(storefrontKeys.collection(slug), data.collection)
  if (data.collectionProducts) {
    const { sort, direction } = COLLECTION_DEFAULT_LIST
    queryClient.setQueryData(
      storefrontKeys.collectionProducts(slug, sort, direction, EMPTY_FILTERS),
      { pages: [data.collectionProducts], pageParams: [undefined] }
    )
  }
}

export async function fetchStoreSettings() {
  const { data } = await http('/store/settings', { schema: StoreSettingsResponseSchema })
  return data
}

/**
 * Public store details and defaults (currency, locale, time zone) for
 * storefront pages. Pair with `formatMoney()` from `~/lib/money`.
 */
export function useStoreSettings() {
  return useQuery({
    queryKey: storeSettingsKeys.all,
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
  })
}

/** The unit product weights and shipping weight bounds are entered in. */
export function useWeightUnit() {
  const { data } = useStoreSettings()
  return data?.weightUnit ?? 'kg'
}

/** The country the store delivers to (set in setup), or null when unset. */
export function useOperatingCountry() {
  const { data } = useStoreSettings()
  return data?.operatingCountryCode ?? null
}

export async function fetchStorefrontTheme() {
  const { data } = await http('/store/theme', { schema: StorefrontThemeResponseSchema })
  return data
}

export function useStorefrontTheme() {
  return useQuery({
    queryKey: storefrontKeys.theme,
    queryFn: fetchStorefrontTheme,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchStorefrontMenu() {
  const { data } = await http('/store/menu', { schema: StorefrontMenuResponseSchema })
  return data
}

export function useStorefrontMenu() {
  return useQuery({
    queryKey: storefrontKeys.menu,
    queryFn: fetchStorefrontMenu,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchStorefrontSession() {
  const { data } = await http('/store/session', { schema: StorefrontSessionResponseSchema })
  return data
}

/**
 * Whether a customer is signed in. Use on public pages instead of
 * `useCustomerMe()`, which gets a 401 for guests.
 */
export function useStorefrontSession() {
  return useQuery({ queryKey: storefrontKeys.session, queryFn: fetchStorefrontSession })
}

/**
 * Ends a staff User's storefront session as a customer and returns them to
 * the customer in the back office. A full page load drops the customer's
 * cached queries.
 */
export function useStopImpersonation() {
  return useMutation({
    mutationFn: () => http('/impersonation', { method: 'DELETE', schema: redirectResponseSchema }),
    onSuccess: ({ data }) => window.location.assign(data.redirectTo),
  })
}

export async function fetchStoreMarket() {
  const { data } = await http('/store/market', { schema: StorefrontMarketResponseSchema })
  return data
}

/**
 * The shopper's market (currency, tax display), the markets they can switch
 * to and the countries orders can be delivered to.
 */
export function useStoreMarket() {
  return useQuery({
    queryKey: storefrontKeys.market,
    queryFn: fetchStoreMarket,
    staleTime: 5 * 60 * 1000,
  })
}

export async function updateStoreMarket(input: StorefrontMarketUpdate) {
  const { data } = await http('/store/market', {
    method: 'PUT',
    body: StorefrontMarketUpdateSchema.parse(input),
    schema: StorefrontMarketResponseSchema,
  })
  return data
}

/**
 * Each newsletter form posts to its own route with its own bot-check action.
 * The maintenance route stays reachable while the store is down.
 */
const NEWSLETTER_ENDPOINTS = {
  footer: { url: '/newsletter', action: 'customer_newsletter' },
  maintenance: { url: '/maintenance/newsletter', action: 'maintenance_newsletter' },
} as const satisfies Record<string, { url: string; action: RecaptchaAction }>

export type NewsletterSource = keyof typeof NEWSLETTER_ENDPOINTS

export async function subscribeNewsletter(
  payload: NewsletterForm,
  source: NewsletterSource = 'footer'
) {
  const { url, action } = NEWSLETTER_ENDPOINTS[source]
  return http(url, {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders(action),
    schema: NewsletterResponseSchema,
  })
}

/** Newsletter signup from the storefront footer or the maintenance page. */
export function useSubscribeNewsletter(source: NewsletterSource = 'footer') {
  return useMutation({
    mutationFn: (payload: NewsletterForm) => subscribeNewsletter(payload, source),
  })
}

/**
 * Switches the shopper's market. Every storefront query is refetched so
 * prices and currency follow the new market.
 */
export function useUpdateStoreMarket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateStoreMarket,
    onSuccess: (data) => queryClient.setQueryData(storefrontKeys.market, data),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: storefrontKeys.all }),
        queryClient.invalidateQueries({ queryKey: checkoutKeys.paymentMethods }),
      ]),
  })
}

/**
 * Money format for storefront prices: the store's locale and display with
 * the shopper's market currency.
 */
export function useStoreMoney(): MoneyFormat {
  const { data: settings } = useStoreSettings()
  const { data: market } = useStoreMarket()
  const base = settings ?? FALLBACK_MONEY
  return {
    locale: base.locale,
    currencyDisplay: base.currencyDisplay,
    currencyCode: market?.current.currencyCode ?? base.currencyCode,
  }
}

/** "Incl. GST" / "Excl. tax" for the shopper's market, or null while loading. */
export function useStoreTaxNote(): string | null {
  const { data: market } = useStoreMarket()
  if (!market) return null
  const taxName = market.current.taxName ?? 'tax'
  return market.current.pricesIncludeTax ? `Incl. ${taxName}` : `Excl. ${taxName}`
}

export async function fetchStoreCartPrices(variantIds: string[]) {
  const { data } = await http('/store/cart/prices', {
    method: 'POST',
    body: { variantIds },
    schema: StorefrontCartPricesResponseSchema,
  })
  return data
}

export async function fetchStorefrontHome() {
  const { data } = await http('/store/home', { schema: StorefrontHomeResponseSchema })
  return data
}

export function useStorefrontHome() {
  return useQuery({
    queryKey: storefrontKeys.home,
    queryFn: fetchStorefrontHome,
    staleTime: 60 * 1000,
  })
}

export async function fetchStorefrontPlugins() {
  const { data } = await http('/store/plugins', { schema: StorefrontPluginsResponseSchema })
  return data
}

/** Plugins staff installed, which decide what each template slot renders. */
export function useStorefrontPlugins() {
  return useQuery({
    queryKey: storefrontKeys.plugins,
    queryFn: fetchStorefrontPlugins,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchStorefrontHomeContent() {
  const { data } = await http('/store/home-content', {
    schema: StorefrontHomeContentResponseSchema,
  })
  return data
}

/** Promo banners, feature tiles and testimonials set up in the back office. */
export function useStorefrontHomeContent() {
  return useQuery({
    queryKey: storefrontKeys.homeContent,
    queryFn: fetchStorefrontHomeContent,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchStorefrontCollection(slug: string) {
  const { data } = await catalogHttp(`/store/collections/view/${encodeURIComponent(slug)}`, {
    schema: StorefrontCollectionResponseSchema,
  })
  return data
}

/** An active collection by slug. A 404 is not retried. */
export function useStorefrontCollection(slug: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: storefrontKeys.collection(slug),
    queryFn: () => fetchStorefrontCollection(slug),
    enabled,
    staleTime: 60 * 1000,
    retry: (failureCount, error) =>
      !(error instanceof HttpError && error.status === 404) && failureCount < 2,
  })
}

export async function fetchStorefrontPage(slug: string) {
  const { data } = await http(`/store/pages/view/${encodeURIComponent(slug)}`, {
    schema: StorefrontPageResponseSchema,
  })
  return data
}

/** An active content page by slug. A 404 is not retried. */
export function useStorefrontPage(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.page(slug),
    queryFn: () => fetchStorefrontPage(slug),
    staleTime: 60 * 1000,
    retry: (failureCount, error) =>
      !(error instanceof HttpError && error.status === 404) && failureCount < 2,
  })
}

export async function fetchStorefrontPolicies() {
  const { data } = await http('/store/policies', { schema: StorefrontPoliciesResponseSchema })
  return data
}

/** Active policy pages (refund, shipping, privacy, terms) for the footers. */
export function useStorefrontPolicies() {
  return useQuery({
    queryKey: storefrontKeys.policies,
    queryFn: fetchStorefrontPolicies,
    staleTime: 5 * 60 * 1000,
  })
}

/** Query-string values for the products list; options become `Size:M` entries. */
function collectionFilterQuery(filters: CollectionFilters) {
  return {
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    vendor: filters.vendor,
    type: filters.type,
    option: Object.entries(filters.options).flatMap(([name, values]) =>
      values.map((value) => `${name}:${value}`)
    ),
    inStock: filters.inStock || undefined,
  }
}

export async function fetchStorefrontCollectionProducts(
  slug: string,
  {
    cursor,
    sort,
    direction,
    filters,
  }: {
    cursor?: string
    sort: StorefrontCollectionSort
    direction: SortDirection
    filters: CollectionFilters
  }
) {
  const query = toQueryString({ cursor, sort, direction, ...collectionFilterQuery(filters) })
  return catalogHttp(`/store/collections/${encodeURIComponent(slug)}/products${query}`, {
    schema: StorefrontCollectionProductsResponseSchema,
  })
}

/**
 * Products in a collection, one page of 24 at a time for "Load more".
 * Each page comes with an opaque cursor for the next one. Changing the
 * sort or filters starts over from the first page while the previous
 * products stay visible.
 */
export function useStorefrontCollectionProducts(
  slug: string,
  {
    sort,
    direction,
    filters,
  }: { sort: StorefrontCollectionSort; direction: SortDirection; filters: CollectionFilters }
) {
  return useInfiniteQuery({
    queryKey: storefrontKeys.collectionProducts(slug, sort, direction, filters),
    queryFn: ({ pageParam }) =>
      fetchStorefrontCollectionProducts(slug, { cursor: pageParam, sort, direction, filters }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ metadata }) => metadata.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export async function fetchStorefrontCollectionFilters(slug: string) {
  const { data } = await catalogHttp(`/store/collections/${encodeURIComponent(slug)}/filters`, {
    schema: StorefrontCollectionFiltersResponseSchema,
  })
  return data
}

/** Price range, vendors, product types and option values a collection can be filtered by. */
export function useStorefrontCollectionFilters(slug: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: storefrontKeys.collectionFilters(slug),
    queryFn: () => fetchStorefrontCollectionFilters(slug),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      !(error instanceof HttpError && error.status === 404) && failureCount < 2,
  })
}

export async function fetchStorefrontProduct(slug: string) {
  const { data } = await catalogHttp(`/store/products/view/${encodeURIComponent(slug)}`, {
    schema: StorefrontProductResponseSchema,
  })
  return data
}

/** An active product by slug. A 404 is not retried. */
export function useStorefrontProduct(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.product(slug),
    queryFn: () => fetchStorefrontProduct(slug),
    staleTime: 60 * 1000,
    retry: (failureCount, error) =>
      !(error instanceof HttpError && error.status === 404) && failureCount < 2,
  })
}

export async function fetchStorefrontSearch(q: string) {
  const { data } = await catalogHttp(`/store/search${toQueryString({ q })}`, {
    schema: StorefrontSearchResponseSchema,
  })
  return data
}

/**
 * Active products matching `q`, best match first. Idle until `q` has
 * STOREFRONT_SEARCH_MIN_LENGTH characters; keeps the previous results
 * visible while the next query loads.
 */
export function useStorefrontSearch(q: string) {
  const query = q.trim()
  return useQuery({
    queryKey: storefrontKeys.search(query),
    queryFn: () => fetchStorefrontSearch(query),
    enabled: query.length >= STOREFRONT_SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
