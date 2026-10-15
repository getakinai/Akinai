import type { HttpContext } from '@adonisjs/core/http'
import type router from '@adonisjs/core/services/router'
import type { middleware } from '#start/kernel'
import type { PluginManifest } from '#constants/plugins'

export type PluginRouter = typeof router
export type PluginMiddleware = typeof middleware

export type PluginRoutesRegistrar = (router: PluginRouter, middleware: PluginMiddleware) => void

/** A record that still shows a media gallery image, so it can't be deleted. */
export type PluginMediaUsage = { type: string; label: string }

export type PluginDefinition = {
  manifest: PluginManifest
  routes?: {
    admin?: PluginRoutesRegistrar
    storefront?: PluginRoutesRegistrar
  }
  prefetch?: {
    home?: (ctx: HttpContext) => Promise<unknown>
  }
  /** Records of this plugin whose image column points at the Drive `key`. */
  mediaUsages?: (key: string) => Promise<PluginMediaUsage[]>
  onBoot?: () => Promise<void>
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
  return definition
}
