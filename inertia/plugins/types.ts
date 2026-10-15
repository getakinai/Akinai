import type { ComponentType, ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { NavRoute } from '~/components/nav_link'

/** Keep in sync with `PLUGIN_SLOTS` in `app/constants/plugins.ts`. */
export type PluginSlotName =
  'home.hero' | 'home.after_first_rail' | 'home.footer' | 'checkout.payment'

export type PluginSlotProps = {
  /** What the template shows when the plugin has nothing to render. */
  fallback?: ReactNode
}

export type PluginAdminNavItem = {
  label: string
  route: NavRoute
  permission?: string
}

export type PluginClientEntry = {
  slot: PluginSlotName
  Component: ComponentType<PluginSlotProps>
  /** Shown in the slot while the installed plugins load. */
  Skeleton?: ComponentType
  seedQueries?: (queryClient: QueryClient, data: unknown) => void
  adminNav?: {
    parentRoute: NavRoute
    items: PluginAdminNavItem[]
  }
}

/** @deprecated Use PluginClientEntry on plugin client exports. */
export type PluginEntry = {
  slot: PluginSlotName
  Component: ComponentType<PluginSlotProps>
}
