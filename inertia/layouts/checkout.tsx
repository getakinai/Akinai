import { type ReactNode, useCallback, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { ShoppingBasket, UserRound } from 'lucide-react'
import { CartProvider, useCart } from 'snappycart'
import { toast } from 'sonner'
import FlashToasts from '~/components/flash_toasts'
import {
  CartDrawer,
  ImpersonationBanner,
  MaintenanceBanner,
  StoreLogo,
} from '~/components/storefront'
import { Skeleton } from '~/components/ui'
import {
  CartReadyContext,
  useCartMarketSync,
  useCartPersistence,
} from '~/hooks/use_cart_persistence'
import { usePageViewTracking } from '~/lib/analytics'
import { APP_NAME } from '~/lib/brand'
import { formatMoney } from '~/lib/money'
import { themeStyle } from '~/lib/storefront'
import { storefront } from '~/lib/styles'
import {
  fetchStoreCartPrices,
  useStoreMarket,
  useStoreMoney,
  useStoreSettings,
  useStoreTaxNote,
  useStorefrontPolicies,
  useStorefrontSession,
  useStorefrontTheme,
  useStopImpersonation,
} from '~/pages/_hooks'

/**
 * Distraction-free shell for checkout: store name linking back to the
 * shop and the cart drawer, no menu. Policy links open in a new tab so the
 * checkout isn't lost. Shares the storefront cart and theme.
 */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CheckoutShell>{children}</CheckoutShell>
    </CartProvider>
  )
}

function CheckoutShell({ children }: { children: ReactNode }) {
  usePageViewTracking()
  const cartReady = useCartPersistence()
  const { data: market } = useStoreMarket()
  useCartMarketSync(cartReady, market?.current.handle ?? null, fetchStoreCartPrices)
  const { data: theme, isLoading: themeLoading } = useStorefrontTheme()
  const { data: settings, isLoading: settingsLoading } = useStoreSettings()
  const { data: session, isLoading: sessionLoading } = useStorefrontSession()
  const { data: policies } = useStorefrontPolicies()
  const stopImpersonation = useStopImpersonation()
  const brandName = theme?.brandName || settings?.storeName || APP_NAME
  const money = useStoreMoney()
  const taxNote = useStoreTaxNote()
  const { totalItems } = useCart()
  const { url } = usePage()
  const [cartOpenedAt, setCartOpenedAt] = useState<string | null>(null)
  const cartOpen = cartOpenedAt === url
  const closeCart = useCallback(() => setCartOpenedAt(null), [])

  return (
    <div
      data-storefront
      style={themeStyle(theme)}
      className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip bg-sf-surface text-sf-text"
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
      <header className="border-b border-sf-line bg-sf-surface">
        <div className="mx-auto flex w-full max-w-[1100px] min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            route="home"
            className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            aria-label={`${brandName}, back to shop`}
          >
            <StoreLogo
              logoUrl={theme?.logoUrl}
              storeName={brandName}
              size={28}
              loading={themeLoading}
            />
            {themeLoading || settingsLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span className="truncate text-[17px] font-semibold tracking-[-0.01em]">
                {brandName}
              </span>
            )}
          </Link>
          <div className="flex flex-none items-center gap-2">
            {sessionLoading ? null : (
              <Link
                route={session?.signedIn ? 'customers.account.home' : 'customers.session.create'}
                className={storefront.iconButton}
                aria-label={session?.signedIn ? 'My account' : 'Sign in'}
              >
                <UserRound size={18} />
              </Link>
            )}
            <button
              type="button"
              className={storefront.iconButton}
              onClick={() => setCartOpenedAt(url)}
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
        </div>
      </header>
      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        formatPrice={(amount) => formatMoney(amount, money)}
        priceNote={taxNote}
        storeName={brandName}
        logoUrl={theme?.logoUrl}
      />
      <main className="flex flex-1 flex-col">
        <CartReadyContext.Provider value={cartReady}>{children}</CartReadyContext.Provider>
      </main>
      {policies && policies.length > 0 && (
        <footer className="border-t border-sf-line bg-sf-surface">
          <nav
            aria-label="Store policies"
            className="mx-auto w-full max-w-[1100px] min-w-0 px-4 py-4 sm:px-6"
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
              {policies.map((policy) => (
                <li key={policy.policyType}>
                  <a
                    href={policy.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sf-primary underline-offset-2 hover:underline"
                  >
                    {policy.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </footer>
      )}
      <FlashToasts />
    </div>
  )
}
