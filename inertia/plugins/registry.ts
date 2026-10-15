import HeroSlideshowPlugin from './hero_slideshow'
import type { PluginEntry } from './types'

/**
 * Storefront components of the bundled plugins, keyed like `PLUGINS` in
 * `app/constants/plugins.ts`. Slots render entries in this order.
 */
export const pluginRegistry: Record<string, PluginEntry> = {
  hero_slideshow: { slot: 'home.hero', Component: HeroSlideshowPlugin },
}
