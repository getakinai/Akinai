import type { ApplicationService } from '@adonisjs/core/types'
import { loadPlugins } from '#plugin_host/loader'

export default class PluginProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    await loadPlugins()
  }
}
