import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PluginService from '#services/plugin_service'

/**
 * Hides a plugin's routes while it is uninstalled:
 * `.use(middleware.plugin({ key: 'hero_slideshow' }))`
 */
@inject()
export default class PluginInstalledMiddleware {
  constructor(protected pluginService: PluginService) {}

  async handle(ctx: HttpContext, next: NextFn, options: { key: string }) {
    if (!(await this.pluginService.isInstalled(options.key))) {
      return ctx.response.notFound({ error: 'Resource not found' })
    }
    return next()
  }
}
