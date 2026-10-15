import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import User from '#models/user'

/**
 * A public image in the media gallery. `key` is the Drive key; the URL is
 * built from it with `imageUrl`, so the base URL lives only in env.
 */
export default class Media extends BaseAppModel {
  static table = 'media'

  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    const label = attributes.originalName ?? attributes.key
    return typeof label === 'string' ? label.slice(0, 255) : null
  }

  @column()
  declare key: string

  @column()
  declare folder: string

  @column()
  declare contentType: string

  @column()
  declare sizeBytes: number | null

  @column()
  declare width: number | null

  @column()
  declare height: number | null

  @column()
  declare originalName: string | null

  @column()
  declare uploadedById: string | null

  @belongsTo(() => User, { foreignKey: 'uploadedById' })
  declare uploadedBy: BelongsTo<typeof User>
}
