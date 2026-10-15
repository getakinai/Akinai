import type { ComponentType, ReactNode } from 'react'
import { useCart } from 'snappycart'
import { useCartDrawer } from '~/hooks/use_cart_drawer'
import { trackEvent } from '~/lib/analytics'
import { useStorefrontPlugins } from '~/pages/_hooks'
import { PluginSlot, type PluginSlotName } from '~/plugins'
import { pluginRegistry } from '~/plugins/registry'

/**
 * React widgets an Edge theme can place. Keep the names in sync with
 * `THEME_ISLANDS` (plus `plugin_slot`) in `app/themes/renderer.ts`.
 */

type IslandProps = {
  props: Record<string, unknown>
  /** The markup the theme printed inside the placeholder. */
  fallback: ReactNode
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function PluginSlotIsland({ props, fallback }: IslandProps) {
  return <PluginSlot name={props.name as PluginSlotName} fallback={fallback} />
}

function CartButtonIsland({ props }: IslandProps) {
  const { totalItems } = useCart()
  const { openCart } = useCartDrawer()
  const label = text(props.label, 'Cart')
  return (
    <button
      type="button"
      className={text(props.class, 'akinai-cart-button')}
      onClick={openCart}
      aria-label={`${label}, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
    >
      <span className="akinai-cart-label">{label}</span>
      <span className="akinai-cart-count" data-empty={totalItems === 0 || undefined}>
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </button>
  )
}

function AppBlockIsland({ props, fallback }: IslandProps) {
  const pluginKey = typeof props.plugin === 'string' ? props.plugin : ''
  const blockType = typeof props.block === 'string' ? props.block : ''
  const { data: installed, isLoading } = useStorefrontPlugins()
  const entry = pluginKey ? pluginRegistry[pluginKey] : undefined
  const Block = blockType && entry?.appBlocks?.[blockType]
  if (!pluginKey || !blockType || !Block) return null
  if (isLoading) {
    const Skeleton = entry?.Skeleton
    return Skeleton ? <Skeleton /> : null
  }
  const installedKeys = new Set((installed ?? []).map((plugin) => plugin.key))
  if (!installedKeys.has(pluginKey)) return null
  return <Block fallback={fallback} />
}

function AddToCartIsland({ props }: IslandProps) {
  const { addItem } = useCart()
  const { openCart } = useCartDrawer()
  const variantId = typeof props.variantId === 'string' ? props.variantId : null
  const price = typeof props.price === 'number' ? props.price : null
  const available = variantId !== null && price !== null && props.available !== false
  return (
    <button
      type="button"
      className={text(props.class, 'akinai-add-to-cart')}
      disabled={!available}
      onClick={() => {
        if (!variantId || price === null) return
        addItem({
          id: variantId,
          name: text(props.title, 'Product'),
          price,
          imageUrl: typeof props.imageUrl === 'string' ? props.imageUrl : undefined,
          metadata: {
            slug: props.slug ?? null,
            vendor: props.vendor ?? null,
            variantId,
          },
        })
        if (typeof props.productId === 'string') {
          trackEvent('add_to_cart', { productId: props.productId })
        }
        openCart()
      }}
    >
      {available ? text(props.label, 'Add to cart') : text(props.soldOutLabel, 'Sold out')}
    </button>
  )
}

export const islandRegistry = {
  plugin_slot: { Component: PluginSlotIsland, usesCart: false },
  app_block: { Component: AppBlockIsland, usesCart: false },
  cart_button: { Component: CartButtonIsland, usesCart: true },
  add_to_cart: { Component: AddToCartIsland, usesCart: true },
} satisfies Record<string, { Component: ComponentType<IslandProps>; usesCart: boolean }>

export type IslandName = keyof typeof islandRegistry
