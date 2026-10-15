import type { ApplicationService } from '@adonisjs/core/types'
import { loadPlugins } from '#plugin_host/loader'

export default class PluginProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const logger = await this.app.container.make('logger')
    await loadPlugins((folder, error) => {
      logger.error({ err: error, plugin: folder }, `Plugin "${folder}" failed to load; skipping it`)
    })
  }
}
