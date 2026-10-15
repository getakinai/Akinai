import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import {
  Building2,
  LifeBuoy,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShoppingBasket,
  UserRound,
  X,
} from 'lucide-react'
import { CartProvider, useCart } from 'snappycart'
import { toast } from 'sonner'
import FlashToasts from '~/components/flash_toasts'
import { openSupportChat } from '~/components/storefront/support_chat/events'
import SupportChat from '~/components/storefront/support_chat/support_chat'
import { useStickyHeaderHeight } from '~/hooks/use_sticky_header_height'
import {
  CartDrawer,
  ImpersonationBanner,
  MaintenanceBanner,
  MarketSwitcher,
  SearchResults,
  StoreLogo,
  type MarketSwitcherOption,
  type SearchResultItem,
} from '~/components/storefront'
import { SearchInput, Skeleton } from '~/components/ui'
import PluginSlot from '~/plugins/plugin_slot'
import { CartDrawerContext } from '~/hooks/use_cart_drawer'
import { useCartMarketSync, useCartPersistence } from '~/hooks/use_cart_persistence'
import { trackEvent, usePageViewTracking } from '~/lib/analytics'
import { APP_NAME } from '~/lib/brand'
import { prefetchCatalogToken } from '~/lib/catalog_http'
import { onCollectionLinkClick } from '~/lib/collection_link'
import { countryName } from '~/lib/countries'
import { formatMoney } from '~/lib/money'
import { productHref } from '~/lib/product_link'
import { themeStyle } from '~/lib/storefront'
import { cn, storefront } from '~/lib/styles'
import {
  STOREFRONT_SEARCH_MIN_LENGTH,
  fetchStoreCartPrices,
  useStoreMarket,
  useStoreMoney,
  useStoreSettings,
  useStoreTaxNote,
  useUpdateStoreMarket,
  useStorefrontMenu,
  useStorefrontPolicies,
  useStorefrontSearch,
  useStorefrontSession,
  useStorefrontTheme,
  useStopImpersonation,
} from '~/pages/_hooks'
import type { StorefrontMenuItem } from '~/pages/_types'

function MenuLink({
  item,
  className,
  onNavigate,
}: {
  item: StorefrontMenuItem
  className: string
  onNavigate?: () => void
}) {
  return (
    <a
      href={item.href}
      className={className}
      onClick={(event) => {
        if (item.collectionSlug) onCollectionLinkClick(event, item.collectionSlug)
        onNavigate?.()
      }}
      {...(item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {item.label}
    </a>
  )
}

function StorefrontSearch({
  value,
  onChange,
  url,
  formatPrice,
  className,
}: {
  value: string
  onChange: (value: string) => void
  url: string
  formatPrice: (amount: number) => string
  className?: string
}) {
  const resultsId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === url
  const query = value.trim()
  const showResults = open && query.length >= STOREFRONT_SEARCH_MIN_LENGTH
  const { data, isFetching, isError, refetch } = useStorefrontSearch(value)
  const { items, addItem, increment, decrement } = useCart()
  const quantities = new Map(items.map((line) => [line.product.id, line.quantity]))

  const handleChange = useCallback(
    (next: string) => {
      onChange(next)
      setOpenedAt(url)
    },
    [onChange, url]
  )

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenedAt(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedAt(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const results: SearchResultItem[] | undefined = data?.map((product) => {
    const { id, title, slug, imageUrl, category, vendor, price, compareAtPrice, variantId } =
      product
    return {
      id,
      title,
      imageUrl,
      category,
      vendor,
      price: price === null ? null : formatPrice(price),
      compareAtPrice: compareAtPrice === null ? null : formatPrice(compareAtPrice),
      href: productHref(slug),
      quantity: variantId === null ? 0 : (quantities.get(variantId) ?? 0),
      onAdd:
        price === null || variantId === null
          ? undefined
          : () => {
              addItem({
                id: variantId,
                name: title,
                price,
                imageUrl: imageUrl ?? undefined,
                metadata: { slug, vendor, variantId },
              })
              trackEvent('add_to_cart', { productId: id })
            },
      onIncrement: () => variantId !== null && increment(variantId),
      onDecrement: () => variantId !== null && decrement(variantId),
    }
  })

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      <SearchInput
        label="Search products"
        placeholder="Search for products…"
        value={value}
        onDebouncedChange={handleChange}
        onFocus={() => setOpenedAt(url)}
        autoComplete="off"
        aria-expanded={showResults}
        aria-controls={showResults ? resultsId : undefined}
      />
      {showResults && (
        <SearchResults
          id={resultsId}
          query={query}
          items={results}
          isLoading={isFetching}
          isError={isError}
          onRetry={() => refetch()}
        />
      )}
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {['w-16', 'w-24', 'w-20', 'w-28'].map((width) => (
        <Skeleton key={width} className={cn('h-4', width)} />
      ))}
    </div>
  )
}

const footerSkeleton = 'block rounded bg-sf-primary-fg/15 motion-safe:animate-pulse'

function FooterLinksSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-3" aria-hidden="true">
      {['w-24', 'w-32', 'w-20', 'w-28'].map((width) => (
        <span key={width} className={cn(footerSkeleton, 'h-3.5', width)} />
      ))}
    </div>
  )
}

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <StorefrontShell>{children}</StorefrontShell>
    </CartProvider>
  )
}

function StorefrontShell({ children }: { children: ReactNode }) {
  usePageViewTracking()
  const cartReady = useCartPersistence()
  const { url } = usePage()
  const { data: theme, isLoading: themeLoading } = useStorefrontTheme()
  const { data: menu, isLoading: menuLoading } = useStorefrontMenu()
  const { data: policies } = useStorefrontPolicies()
  const { data: settings, isLoading: settingsLoading } = useStoreSettings()
  const { data: session, isLoading: sessionLoading } = useStorefrontSession()
  const { data: market } = useStoreMarket()
  const updateMarket = useUpdateStoreMarket()
  const stopImpersonation = useStopImpersonation()
  const showSupportChat = session && !url.startsWith('/checkout')
  const money = useStoreMoney()
  const taxNote = useStoreTaxNote()
  useCartMarketSync(cartReady, market?.current.handle ?? null, fetchStoreCartPrices)
  const marketOptions: MarketSwitcherOption[] = (market?.markets ?? []).map((option) => ({
    value: option.handle,
    label: option.countryCode ?? option.currencyCode,
    title: `${option.name} (${option.currencyCode})`,
  }))
  const { totalItems } = useCart()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [cartOpenedAt, setCartOpenedAt] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const drawerOpen = openedAt === url
  const cartOpen = cartOpenedAt === url
  const closeDrawer = () => setOpenedAt(null)
  const closeCart = useCallback(() => setCartOpenedAt(null), [])
  const cartDrawer = useMemo(() => ({ openCart: () => setCartOpenedAt(url) }), [url])
  const formatPrice = (amount: number) => formatMoney(amount, money)
  const headerRef = useRef<HTMLElement>(null)
  useStickyHeaderHeight(headerRef)

  useEffect(() => {
    prefetchCatalogToken()
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedAt(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const storeName = settings?.storeName ?? APP_NAME
  const brandName = theme?.brandName || storeName
  const announcement = theme?.announcementText ?? null
  const announcementUrl = theme?.announcementUrl ?? null
  const announcementIsExternal = /^https?:\/\//.test(announcementUrl ?? '')
  const brandLoading = themeLoading || settingsLoading
  const items = menu ?? []
  const address = [
    settings?.storeAddressLine1,
    settings?.storeSuburb,
    settings?.storeCity,
    settings?.storePostalCode,
    settings?.storeCountryCode ? countryName(settings.storeCountryCode) : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <CartDrawerContext.Provider value={cartDrawer}>
      <div
        data-storefront
        style={themeStyle(theme)}
        className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip bg-sf-bg text-sf-text"
      >
        {session?.impersonation && (
          <ImpersonationBanner
            customerName={session.impersonation.customerName}
            stopping={stopImpersonation.isPending}
            onStop={() =>
              stopImpersonation.mutate(undefined, {
                onError: () => toast.error('We couldn’t stop impersonating. Try again.'),
              })
            }
          />
        )}
        {session?.maintenance && <MaintenanceBanner />}
        {announcement && (
          <div className="bg-sf-primary text-sf-primary-fg">
            <p
              className={cn(
                storefront.container,
                'py-2 text-center text-[12.5px] font-medium break-words'
              )}
            >
              {announcementUrl ? (
                <a
                  href={announcementUrl}
                  target={announcementIsExternal ? '_blank' : undefined}
                  rel={announcementIsExternal ? 'noreferrer' : undefined}
                  className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {announcement}
                </a>
              ) : (
                announcement
              )}
            </p>
          </div>
        )}

        <header ref={headerRef} className="sticky top-0 z-20 border-b border-sf-line bg-sf-surface">
          <div
            className={cn(
              storefront.container,
              'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:gap-5'
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className={cn(storefront.iconButton, 'min-[900px]:hidden')}
                onClick={() => setOpenedAt(url)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                aria-controls="storefront-drawer"
              >
                <Menu size={18} />
              </button>
              <div className="hidden min-w-0 sm:flex">
                <StoreLogo
                  logoUrl={theme?.logoUrl}
                  storeName={brandName}
                  size={52}
                  variant="large"
                  loading={themeLoading}
                />
              </div>
              {brandLoading ? (
                <Skeleton className="hidden h-4 w-28 sm:block" />
              ) : (
                <span className="hidden truncate text-[16px] font-semibold tracking-[-0.01em] sm:block">
                  {brandName}
                </span>
              )}
            </div>

            <StorefrontSearch
              value={search}
              onChange={setSearch}
              url={url}
              formatPrice={formatPrice}
              className="hidden w-full sm:block sm:max-w-[520px] sm:justify-self-center"
            />
            <span className="sm:hidden" />

            <div className="flex items-center gap-2">
              <MarketSwitcher
                options={marketOptions}
                value={market?.current.handle ?? null}
                disabled={updateMarket.isPending}
                onChange={(handle) =>
                  updateMarket.mutate(
                    { handle },
                    { onError: () => toast.error('We couldn’t switch your country. Try again.') }
                  )
                }
              />
              {sessionLoading ? (
                <Skeleton className="size-10 rounded-lg" />
              ) : session?.signedIn ? (
                <Link
                  route="customers.account.home"
                  className={storefront.iconButton}
                  aria-label="My account"
                >
                  <UserRound size={18} />
                </Link>
              ) : (
                <Link
                  route="customers.session.create"
                  className={storefront.iconButton}
                  aria-label="Sign in"
                >
                  <UserRound size={18} />
                </Link>
              )}
              <button
                type="button"
                className={storefront.iconButton}
                onClick={cartDrawer.openCart}
                aria-label={`Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                aria-expanded={cartOpen}
                aria-controls="storefront-cart"
              >
                <ShoppingBasket size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-sf-accent px-1 text-[11px] font-semibold text-sf-text tabular-nums">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            </div>

            <StorefrontSearch
              value={search}
              onChange={setSearch}
              url={url}
              formatPrice={formatPrice}
              className="col-span-3 sm:hidden"
            />
          </div>

          <nav
            aria-label="Store"
            className={cn(storefront.container, 'hidden border-t border-sf-line min-[900px]:block')}
          >
            {menuLoading ? (
              <MenuSkeleton />
            ) : (
              <ul className="flex flex-wrap items-center gap-1 py-1.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <MenuLink item={item} className={storefront.menuLink} />
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </header>

        {drawerOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-sf-text/30 backdrop-blur-[2px] min-[900px]:hidden"
            onClick={closeDrawer}
          />
        )}
        <aside
          id="storefront-drawer"
          aria-hidden={!drawerOpen}
          inert={!drawerOpen}
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[min(300px,85vw)] flex-col border-r border-sf-line bg-sf-surface transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] min-[900px]:hidden',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-sf-line px-4">
            <div className="flex min-w-0 items-center gap-2">
              <StoreLogo logoUrl={theme?.logoUrl} storeName={brandName} loading={themeLoading} />
              {brandLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span className="truncate text-[15px] font-semibold">{brandName}</span>
              )}
            </div>
            <button
              type="button"
              className={storefront.iconButton}
              onClick={closeDrawer}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav aria-label="Store" className="flex flex-col gap-0.5 overflow-y-auto p-3">
            {menuLoading ? (
              <MenuSkeleton />
            ) : (
              items.map((item) => (
                <MenuLink
                  key={item.id}
                  item={item}
                  className={cn(storefront.menuLink, 'w-full')}
                  onNavigate={closeDrawer}
                />
              ))
            )}
          </nav>
        </aside>

        <CartDrawer
          open={cartOpen}
          onClose={closeCart}
          formatPrice={formatPrice}
          priceNote={taxNote}
          storeName={brandName}
          logoUrl={theme?.logoUrl}
        />

        <main className="flex-1 pb-16">{children}</main>

        <footer className="bg-sf-primary text-sf-primary-fg">
          <PluginSlot name="layout.footer" />
          <div
            className={cn(
              storefront.container,
              'grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.3fr]'
            )}
          >
            <div className="min-w-0">
              {brandLoading ? (
                <div className="flex flex-col gap-3" aria-hidden="true">
                  <span className={cn(footerSkeleton, 'h-5 w-36')} />
                  <span className={cn(footerSkeleton, 'h-3.5 w-full max-w-sm')} />
                  <span className={cn(footerSkeleton, 'h-3.5 w-2/3 max-w-60')} />
                </div>
              ) : (
                <>
                  <div className="text-[17px] font-semibold">{brandName}</div>
                  <p className="mt-2 max-w-sm text-[13.5px] break-words opacity-80">
                    {theme?.footerTagline || `Shop online with ${brandName}.`}
                  </p>
                </>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold tracking-[0.06em] uppercase opacity-70">
                Shop
              </div>
              {menuLoading ? (
                <FooterLinksSkeleton />
              ) : (
                <ul className="mt-3 flex flex-col gap-2 text-[14px]">
                  {items.map((item) => (
                    <li key={item.id}>
                      <MenuLink
                        item={item}
                        className="opacity-90 hover:underline hover:opacity-100"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold tracking-[0.06em] uppercase opacity-70">
                Contact
              </div>
              {settingsLoading && <FooterLinksSkeleton />}
              <ul className="mt-3 flex flex-col gap-2.5 text-[14px] opacity-90">
                {settings?.legalName && (
                  <li className="flex items-start gap-2">
                    <Building2 size={15} className="mt-0.5 flex-none" />
                    {settings.legalName}
                  </li>
                )}
                {settings?.contactEmail && (
                  <li className="flex min-w-0 items-center gap-2">
                    <Mail size={15} className="flex-none" />
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="truncate hover:underline"
                    >
                      {settings.contactEmail}
                    </a>
                  </li>
                )}
                {settings?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={15} className="flex-none" />
                    {settings.phone}
                  </li>
                )}
                {address && (
                  <li className="flex items-start gap-2">
                    <MapPin size={15} className="mt-0.5 flex-none" />
                    {address}
                  </li>
                )}
                <li className="mt-1 flex items-center gap-2 border-t border-sf-primary-fg/15 pt-3.5">
                  <LifeBuoy size={15} className="flex-none" />
                  <Link route="storefront.help.home" className="hover:underline">
                    Help & support
                  </Link>
                </li>
                {showSupportChat && (
                  <li className="flex items-center gap-2">
                    <MessageCircle size={15} className="flex-none" />
                    <button
                      type="button"
                      onClick={openSupportChat}
                      className="cursor-pointer hover:underline"
                    >
                      Chat support
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-sf-primary-fg/15">
            <div
              className={cn(
                storefront.container,
                'flex flex-col gap-2 py-4 text-[12.5px] sm:flex-row sm:items-center sm:justify-between sm:gap-4'
              )}
            >
              <p className="opacity-70">
                © {new Date().getFullYear()} {brandName}. All rights reserved.
              </p>
              {policies && policies.length > 0 && (
                <nav aria-label="Store policies">
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {policies.map((policy) => (
                      <li key={policy.policyType}>
                        <a
                          href={policy.href}
                          className="opacity-80 hover:underline hover:opacity-100"
                        >
                          {policy.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </footer>
        <FlashToasts />
        {showSupportChat && <SupportChat signedIn={session.signedIn} />}
      </div>
    </CartDrawerContext.Provider>
  )
}
