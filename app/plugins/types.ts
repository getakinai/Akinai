import type { HttpContext } from '@adonisjs/core/http'
import type router from '@adonisjs/core/services/router'
import type { middleware } from '#start/kernel'
import type { PluginManifest } from '#constants/plugins'

export type PluginRouter = typeof router
export type PluginMiddleware = typeof middleware

export type PluginRoutesRegistrar = (router: PluginRouter, middleware: PluginMiddleware) => void

export type PluginDefinition = {
  manifest: PluginManifest
  routes?: {
    admin?: PluginRoutesRegistrar
    storefront?: PluginRoutesRegistrar
  }
  prefetch?: {
    home?: (ctx: HttpContext) => Promise<unknown>
  }
  onBoot?: () => Promise<void>
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
  return definition
}
