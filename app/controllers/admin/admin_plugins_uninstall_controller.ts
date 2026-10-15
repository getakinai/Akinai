import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PluginService from '#services/plugin_service'
import { adminPluginsInstallValidator } from '#validators/admin_plugins_install_validator'

@inject()
export default class AdminPluginsUninstallController {
  constructor(protected pluginService: PluginService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminPluginsInstallValidator)
    await this.pluginService.uninstall(params.key)
    return ctx.response.noContent()
  }
}
