import { createContext, useContext } from 'react'

type CartDrawerContextValue = { openCart: () => void }

export const CartDrawerContext = createContext<CartDrawerContextValue>({ openCart: () => {} })

/** Opens the storefront cart drawer owned by `StorefrontLayout`. */
export function useCartDrawer() {
  return useContext(CartDrawerContext)
}
