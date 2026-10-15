import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import { pluginManifest } from '#constants/plugins'

/**
 * Whether staff installed a bundled plugin (see `#constants/plugins`). A
 * plugin without a row falls back to its `defaultInstalled`.
 */
export default class PluginInstallation extends BaseAppModel {
  static auditLabelFor(attributes: Record<string, unknown>) {
    const key = typeof attributes.key === 'string' ? attributes.key : null
    return key ? (pluginManifest(key)?.name ?? key) : null
  }

  @column()
  declare key: string

  @column()
  declare isInstalled: boolean

  @column({
    prepare: (value: Record<string, unknown> | null) => (value ? JSON.stringify(value) : null),
  })
  declare settings: Record<string, unknown> | null

  @column.dateTime()
  declare installedAt: DateTime | null
}
