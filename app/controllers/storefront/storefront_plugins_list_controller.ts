import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PluginService from '#services/plugin_service'
import PluginTransformer from '#transformers/plugin_transformer'

@inject()
export default class StorefrontPluginsListController {
  constructor(protected pluginService: PluginService) {}

  async handle(ctx: HttpContext) {
    const catalog = await this.pluginService.catalog()
    const installed = catalog.filter((plugin) => plugin.isInstalled)
    return ctx.serialize(PluginTransformer.transform(installed).useVariant('toPublic'))
  }
}
