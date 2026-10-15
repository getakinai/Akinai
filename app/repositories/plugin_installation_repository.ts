import { DateTime } from 'luxon'
import PluginInstallation from '#models/plugin_installation'

export default class PluginInstallationRepository {
  async all(): Promise<PluginInstallation[]> {
    return PluginInstallation.query().orderBy('key', 'asc')
  }

  async findByKey(key: string): Promise<PluginInstallation | null> {
    return PluginInstallation.findBy('key', key)
  }

  async setInstalled(key: string, isInstalled: boolean): Promise<PluginInstallation> {
    const existing = await this.findByKey(key)
    if (!existing) {
      return PluginInstallation.create({
        key,
        isInstalled,
        installedAt: isInstalled ? DateTime.now() : null,
      })
    }
    if (existing.isInstalled === isInstalled) return existing
    existing.isInstalled = isInstalled
    if (isInstalled) existing.installedAt = DateTime.now()
    await existing.save()
    return existing
  }
}
