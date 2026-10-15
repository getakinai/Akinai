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

/** Re-exported from the plugin loader after boot. */
export type PluginKey = string
