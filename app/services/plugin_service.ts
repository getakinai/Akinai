import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { PLUGINS, pluginManifest, type PluginKey, type PluginManifest } from '#constants/plugins'
import PluginInstallationRepository from '#repositories/plugin_installation_repository'

export type PluginCatalogEntry = PluginManifest & {
  isInstalled: boolean
  installedAt: DateTime | null
}
@inject()
export default class PluginService {
  constructor(protected pluginInstallationRepository: PluginInstallationRepository) {}

  /** Every bundled plugin with its installed state, in registry order. */
  async catalog(): Promise<PluginCatalogEntry[]> {
    const rows = await this.pluginInstallationRepository.all()
    const byKey = new Map(rows.map((row) => [row.key, row]))
    return PLUGINS.map((plugin) => {
      const row = byKey.get(plugin.key)
      return {
        ...plugin,
        slots: [...plugin.slots],
        isInstalled: row ? row.isInstalled : plugin.defaultInstalled,
        installedAt: row?.installedAt ?? null,
      }
    })
  }

  async installedKeys(): Promise<string[]> {
    const catalog = await this.catalog()
    return catalog.filter((plugin) => plugin.isInstalled).map((plugin) => plugin.key)
  }

  async isInstalled(key: string): Promise<boolean> {
    const manifest = pluginManifest(key)
    if (!manifest) return false
    const row = await this.pluginInstallationRepository.findByKey(key)
    return row ? row.isInstalled : manifest.defaultInstalled
  }

  /** Data the plugin keeps (slides, settings) survives, so reinstalling restores it. */
  async install(key: PluginKey) {
    return this.pluginInstallationRepository.setInstalled(key, true)
  }

  async uninstall(key: PluginKey) {
    return this.pluginInstallationRepository.setInstalled(key, false)
  }
}
