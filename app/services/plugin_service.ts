import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import type { PluginManifest } from '#constants/plugins'
import BusinessRuleException from '#exceptions/business_rule_exception'
import { pluginKeys, pluginManifest, registeredPlugins } from '#plugin_host/registry'
import PluginInstallationRepository from '#repositories/plugin_installation_repository'

export type PluginCatalogEntry = PluginManifest & {
  isInstalled: boolean
  installedAt: DateTime | null
}

export type PluginKey = string

@inject()
export default class PluginService {
  constructor(protected pluginInstallationRepository: PluginInstallationRepository) {}

  /** Every bundled plugin with its installed state, in registry order. */
  async catalog(): Promise<PluginCatalogEntry[]> {
    const rows = await this.pluginInstallationRepository.all()
    const byKey = new Map(rows.map((row) => [row.key, row]))
    return registeredPlugins().map((plugin) => {
      const row = byKey.get(plugin.manifest.key)
      return {
        ...plugin.manifest,
        slots: [...plugin.manifest.slots],
        isInstalled: row ? row.isInstalled : plugin.manifest.defaultInstalled,
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

  async install(key: string) {
    if (!pluginKeys().includes(key)) {
      throw new BusinessRuleException('Unknown plugin', 422)
    }
    return this.pluginInstallationRepository.setInstalled(key, true)
  }

  async uninstall(key: string) {
    if (!pluginKeys().includes(key)) {
      throw new BusinessRuleException('Unknown plugin', 422)
    }
    return this.pluginInstallationRepository.setInstalled(key, false)
  }
}
