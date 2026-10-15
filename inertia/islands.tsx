import './lib/csp_style_patch'
import './css/app.css'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { CartProvider } from 'snappycart'
import { client } from './client'
import { CartDrawer } from './components/storefront'
import { CartDrawerContext } from './hooks/use_cart_drawer'
import { useCartMarketSync, useCartPersistence } from './hooks/use_cart_persistence'
import { islandRegistry, type IslandName } from './islands/registry'
import { trackEvent } from './lib/analytics'
import { APP_NAME } from './lib/brand'
import { formatMoney } from './lib/money'
import { createQueryClient } from './lib/query_client'
import {
  fetchStoreCartPrices,
  seedStorefrontQueries,
  useStoreMarket,
  useStoreMoney,
  useStoreSettings,
  useStoreTaxNote,
  useStorefrontTheme,
} from './pages/_hooks'

/**
 * Entry for pages rendered by an uploaded Edge theme. Each
 * `<div data-akinai-island>` the theme printed becomes a portal of one
 * React root, so every island shares the cart, query cache and drawer.
 */

type MountedIsland = {
  key: string
  name: IslandName
  element: HTMLElement
  props: Record<string, unknown>
  fallbackHtml: string
}

type IslandsBoot = {
  root: Root
  queryClient: QueryClient
  islands: MountedIsland[]
}

declare global {
  interface Window {
    __akinaiIslands?: IslandsBoot
  }
}

function collectIslands(): MountedIsland[] {
  return [...document.querySelectorAll<HTMLElement>('[data-akinai-island]')].flatMap(
    (element, index) => {
      if (element.dataset.akinaiMounted === 'true') return []
      const name = element.dataset.akinaiIsland as IslandName
      if (!(name in islandRegistry)) return []
      let props: Record<string, unknown> = {}
      try {
        props = JSON.parse(element.dataset.props ?? '{}')
      } catch {}
      const fallbackHtml = element.innerHTML
      element.innerHTML = ''
      element.dataset.akinaiMounted = 'true'
      return [{ key: `${name}-${index}`, name, element, props, fallbackHtml }]
    }
  )
}

function readIslandsData(): Record<string, unknown> {
  try {
    return JSON.parse(document.getElementById('akinai-islands-data')?.textContent ?? '{}')
  } catch {
    return {}
  }
}

function IslandsRoot({ islands }: { islands: MountedIsland[] }) {
  const cartReady = useCartPersistence()
  const { data: market } = useStoreMarket()
  const { data: settings } = useStoreSettings()
  const { data: theme } = useStorefrontTheme()
  const money = useStoreMoney()
  const taxNote = useStoreTaxNote()
  const [cartOpen, setCartOpen] = useState(false)
  const drawer = useMemo(() => ({ openCart: () => setCartOpen(true) }), [])
  useCartMarketSync(cartReady, market?.current.handle ?? null, fetchStoreCartPrices)

  useEffect(() => {
    trackEvent('page_view')
  }, [])

  const usesCart = islands.some((island) => islandRegistry[island.name].usesCart)
  const storeName = theme?.brandName || settings?.storeName || APP_NAME

  return (
    <CartDrawerContext.Provider value={drawer}>
      {islands.map(({ key, name, element, props, fallbackHtml }) => {
        const { Component } = islandRegistry[name]
        const fallback: ReactNode =
          name === 'plugin_slot' && fallbackHtml ? (
            <div className="contents" dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
          ) : null
        return createPortal(<Component props={props} fallback={fallback} />, element, key)
      })}
      {usesCart && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          formatPrice={(amount) => formatMoney(amount, money)}
          priceNote={taxNote}
          storeName={storeName}
          logoUrl={theme?.logoUrl}
          fullPageLinks
        />
      )}
    </CartDrawerContext.Provider>
  )
}

function renderIslands(boot: IslandsBoot) {
  boot.root.render(
    <QueryClientProvider client={boot.queryClient}>
      <TuyauProvider client={client}>
        <CartProvider>
          <IslandsRoot islands={boot.islands} />
        </CartProvider>
      </TuyauProvider>
    </QueryClientProvider>
  )
}

function bootstrap() {
  if (window.__akinaiIslands) return

  const islands = collectIslands()
  const queryClient = createQueryClient()
  seedStorefrontQueries(queryClient, readIslandsData())

  const container = document.createElement('div')
  container.id = 'akinai-islands'
  document.body.appendChild(container)

  const boot: IslandsBoot = {
    root: createRoot(container),
    queryClient,
    islands,
  }
  window.__akinaiIslands = boot
  renderIslands(boot)

  if (import.meta.hot) {
    import.meta.hot.accept(() => renderIslands(boot))
  }
}

bootstrap()
