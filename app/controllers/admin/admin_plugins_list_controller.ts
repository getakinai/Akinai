import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PluginService from '#services/plugin_service'
import PluginTransformer from '#transformers/plugin_transformer'

@inject()
export default class AdminPluginsListController {
  constructor(protected pluginService: PluginService) {}

  async handle(ctx: HttpContext) {
    const plugins = await this.pluginService.catalog()
    return ctx.serialize(PluginTransformer.transform(plugins))
  }
}
