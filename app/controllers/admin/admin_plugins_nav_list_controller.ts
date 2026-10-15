import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PluginService from '#services/plugin_service'
import PluginTransformer from '#transformers/plugin_transformer'

/**
 * Installed plugins for the admin sidebar. Open to all staff; each entry
 * carries the permission its admin page needs.
 */
@inject()
export default class AdminPluginsNavListController {
  constructor(protected pluginService: PluginService) {}

  async handle(ctx: HttpContext) {
    const plugins = await this.pluginService.catalog()
    return ctx.serialize(
      PluginTransformer.transform(plugins.filter((plugin) => plugin.isInstalled)).useVariant(
        'toNav'
      )
    )
  }
}
