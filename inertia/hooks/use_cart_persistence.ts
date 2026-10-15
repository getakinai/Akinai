import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCart } from 'snappycart'
import { StoredCartSchema } from '~/pages/_types'

const STORAGE_KEY = 'hp_cart'
const MARKET_STORAGE_KEY = 'hp_cart_market'

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = StoredCartSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return []
    return parsed.data.map((line) => {
      const variantId = line.product.metadata?.variantId
      return typeof variantId === 'string' && line.product.id !== variantId
        ? { ...line, product: { ...line.product, id: variantId } }
        : line
    })
  } catch {
    return []
  }
}

/**
 * Empties the in-memory cart and the stored copy. Clearing storage too
 * matters on a fresh page load, where the layout replays storage after
 * page effects have run.
 */
export function useClearCart() {
  const { clear } = useCart()
  return () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
    clear()
  }
}

/**
 * Restores the snappycart state from localStorage once on mount, then
 * writes it back on every change. snappycart has no initial-state prop, so
 * the stored lines are replayed through `addItem`. Lines are keyed by
 * variant id; older lines keyed by product id are re-keyed on load.
 */
export function useCartPersistence() {
  const { items, addItem } = useCart()
  const hydrated = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    if (items.length === 0) {
      for (const line of readStoredCart()) addItem(line.product, line.quantity)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, ready])

  return ready
}

/**
 * Keeps cart prices in the shopper's market. The market the cart was priced
 * in is stored next to it; when the shopper is in another market, every
 * line is repriced and lines with no price there are removed.
 */
export function useCartMarketSync(
  ready: boolean,
  market: string | null,
  fetchPrices: (variantIds: string[]) => Promise<{
    market: string
    prices: { variantId: string; price: number }[]
  }>
) {
  const { items, addItem, removeItem } = useCart()
  const syncing = useRef<string | null>(null)

  useEffect(() => {
    if (!ready || !market || syncing.current === market) return
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(MARKET_STORAGE_KEY)
    } catch {}
    const remember = () => {
      try {
        window.localStorage.setItem(MARKET_STORAGE_KEY, market)
      } catch {}
    }
    if (stored === market) return
    if (items.length === 0) return remember()

    syncing.current = market
    const lines = items
    fetchPrices(lines.map(({ product }) => String(product.id)))
      .then((result) => {
        if (result.market !== market) return
        const prices = new Map(result.prices.map(({ variantId, price }) => [variantId, price]))
        let removed = 0
        for (const { product, quantity } of lines) {
          const price = prices.get(String(product.id))
          removeItem(product.id)
          if (price === undefined) removed++
          else addItem({ ...product, price }, quantity)
        }
        remember()
        if (removed > 0) {
          toast.info(
            removed === 1
              ? 'One item isn’t sold in your country and was removed from your cart'
              : `${removed} items aren’t sold in your country and were removed from your cart`
          )
        }
      })
      .catch(() => {
        syncing.current = null
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, market, items.length])
}

/**
 * True once the layout has restored the stored cart. Until then an empty
 * cart may just mean "not loaded yet".
 */
export const CartReadyContext = createContext(false)

export function useCartReady() {
  return useContext(CartReadyContext)
}
