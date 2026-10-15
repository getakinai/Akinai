import { DateTime } from 'luxon'
import { belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import ThemeSetting from '#models/theme_setting'
import ThemeTemplate from '#models/theme_template'
import User from '#models/user'
import type {
  ThemeManifest,
  ThemeRole,
  ThemeSectionSchema,
  ThemeSettingsGroup,
  ThemeSource,
} from '#constants/themes'

const json = { prepare: (value: unknown) => JSON.stringify(value) }

/**
 * A storefront theme in the theme library. The package (Edge templates and
 * assets) lives on the private Drive disk at `driveKey`; the parsed schemas
 * are cached here so listing and validating never unzip it.
 */
export default class Theme extends BaseAppModel {
  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare version: string

  @column()
  declare author: string | null

  @column()
  declare description: string | null

  @column()
  declare role: ThemeRole

  @column()
  declare source: ThemeSource

  @column()
  declare driveKey: string

  /** SHA-256 of the package; names the extracted copy on each server. */
  @column()
  declare packageHash: string

  @column(json)
  declare manifest: ThemeManifest

  @column(json)
  declare settingsSchema: ThemeSettingsGroup[]

  @column(json)
  declare sectionSchemas: Record<string, ThemeSectionSchema>

  /** Path inside the package, served from the theme asset route. */
  @column()
  declare previewImage: string | null

  @column()
  declare uploadedById: string | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'uploadedById' })
  declare uploadedBy: BelongsTo<typeof User>

  @hasOne(() => ThemeSetting)
  declare settings: HasOne<typeof ThemeSetting>

  @hasMany(() => ThemeTemplate)
  declare templates: HasMany<typeof ThemeTemplate>
}
