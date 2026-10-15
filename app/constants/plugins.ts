/**
 * Named placeholders in storefront templates. A plugin fills the slots it
 * declares; the template shows its fallback while none is installed.
 */
export const PLUGIN_SLOTS = [
  'home.hero',
  'home.after_first_rail',
  'home.footer',
  'checkout.payment',
] as const

export type PluginSlot = (typeof PLUGIN_SLOTS)[number]

export const PLUGIN_CATEGORIES = ['storefront', 'payments', 'marketing'] as const

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number]

export type PluginManifest = {
  key: string
  name: string
  description: string
  category: PluginCategory
  slots: PluginSlot[]
  /** Counts as installed until staff uninstall it. */
  defaultInstalled: boolean
  /** Back-office page where staff configure the plugin. */
  adminRoute: string | null
}

/**
 * Every plugin that ships with the app. The storefront renders a plugin
 * only when its key is also registered in `inertia/plugins/registry.ts`.
 */
export const PLUGINS = [
  {
    key: 'hero_slideshow',
    name: 'Hero slideshow',
    description:
      'A rotating banner at the top of the home page. Each slide links to a collection, page or URL.',
    category: 'storefront',
    slots: ['home.hero'],
    defaultInstalled: true,
    adminRoute: 'admin.storefront_hero.home',
  },
] as const satisfies readonly PluginManifest[]

export type PluginKey = (typeof PLUGINS)[number]['key']

export const PLUGIN_KEYS = PLUGINS.map((plugin) => plugin.key) as PluginKey[]

export function pluginManifest(key: string): PluginManifest | null {
  return PLUGINS.find((plugin) => plugin.key === key) ?? null
}
