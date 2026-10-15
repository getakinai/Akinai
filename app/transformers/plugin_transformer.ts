import { BaseTransformer } from '@adonisjs/core/transformers'
import type { PluginCatalogEntry } from '#services/plugin_service'

/**
 * A marketplace entry for the back office. `toPublic` keeps only what the
 * storefront needs to fill its slots.
 */
export default class PluginTransformer extends BaseTransformer<PluginCatalogEntry> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'key',
        'name',
        'description',
        'category',
        'slots',
        'adminRoute',
        'isInstalled',
      ]),
      installedAt: this.resource.installedAt?.toISO() ?? null,
    }
  }

  toPublic() {
    return this.pick(this.resource, ['key', 'slots'])
  }
}
