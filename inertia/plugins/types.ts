import type { ComponentType, ReactNode } from 'react'

/** Keep in sync with `PLUGIN_SLOTS` in `app/constants/plugins.ts`. */
export type PluginSlotName =
  'home.hero' | 'home.after_first_rail' | 'home.footer' | 'checkout.payment'

export type PluginSlotProps = {
  /** What the template shows when the plugin has nothing to render. */
  fallback?: ReactNode
}

export type PluginEntry = {
  slot: PluginSlotName
  Component: ComponentType<PluginSlotProps>
}
