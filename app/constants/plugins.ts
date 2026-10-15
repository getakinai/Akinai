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

/** Block type merchants can drop into theme sections that accept `@app` blocks. */
export type PluginAppBlockDefinition = {
  type: string
  name: string
}

export type PluginManifest = {
  key: string
  name: string
  description: string
  category: PluginCategory
  slots: PluginSlot[]
  /** Blocks staff can add in the theme editor when a section allows `@app`. */
  appBlocks?: PluginAppBlockDefinition[]
  /** Counts as installed until staff uninstall it. */
  defaultInstalled: boolean
  /** Back-office page where staff configure the plugin. */
  adminRoute: string | null
}

/** Re-exported from the plugin loader after boot. */
export type PluginKey = string
