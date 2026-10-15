import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Theme from '#models/theme'
import ThemeSetting from '#models/theme_setting'
import ThemeSourceDraft from '#models/theme_source_draft'
import ThemeTemplate from '#models/theme_template'
import type {
  ThemeManifest,
  ThemeSectionSchema,
  ThemeSettingsData,
  ThemeSettingsGroup,
  ThemeSource,
  ThemeTemplateData,
} from '#constants/themes'

export type ThemeCreateInput = {
  manifest: ThemeManifest
  name?: string
  source: ThemeSource
  driveKey: string
  packageHash: string
  settingsSchema: ThemeSettingsGroup[]
  sectionSchemas: Record<string, ThemeSectionSchema>
  settingsData: ThemeSettingsData
  templates: Record<string, ThemeTemplateData>
  uploadedById: string | null
}

export default class ThemeRepository {
  /** The live theme first, then the library, newest first. */
  async all(): Promise<Theme[]> {
    return Theme.query()
      .preload('uploadedBy')
      .orderByRaw(`CASE WHEN role = 'live' THEN 0 ELSE 1 END`)
      .orderBy('created_at', 'desc')
  }

  async find(id: string): Promise<Theme | null> {
    return Theme.find(id)
  }

  async findOrFail(id: string): Promise<Theme> {
    return Theme.findOrFail(id)
  }

  async live(): Promise<Theme | null> {
    return Theme.findBy('role', 'live')
  }

  async findBySource(key: string, source: ThemeSource): Promise<Theme[]> {
    return Theme.query().where('key', key).where('source', source)
  }

  /**
   * Points `themes` at a new package. Saved settings and templates are kept;
   * templates the package adds are created from its defaults.
   */
  async updatePackage(
    themes: Theme[],
    input: Omit<ThemeCreateInput, 'source' | 'name' | 'uploadedById' | 'settingsData'>
  ): Promise<void> {
    await db.transaction(async (trx) => {
      for (const theme of themes) {
        theme.useTransaction(trx)
        theme.merge({
          version: input.manifest.version,
          author: input.manifest.author,
          description: input.manifest.description,
          driveKey: input.driveKey,
          packageHash: input.packageHash,
          manifest: input.manifest,
          settingsSchema: input.settingsSchema,
          sectionSchemas: input.sectionSchemas,
          previewImage: input.manifest.previewImage,
        })
        await theme.save()
        const existing = await ThemeTemplate.query({ client: trx })
          .where('theme_id', theme.id)
          .select('name')
        const names = new Set(existing.map((template) => template.name))
        for (const [name, data] of Object.entries(input.templates)) {
          if (names.has(name)) continue
          await ThemeTemplate.create(
            { themeId: theme.id, name, data, draftData: null },
            { client: trx }
          )
        }
      }
    })
  }

  async isDriveKeyShared(driveKey: string, exceptId: string): Promise<boolean> {
    const row = await Theme.query().where('drive_key', driveKey).whereNot('id', exceptId).first()
    return row !== null
  }

  async isDriveKeyUsed(driveKey: string): Promise<boolean> {
    const row = await Theme.query().where('drive_key', driveKey).first()
    return row !== null
  }

  async settings(theme: Theme): Promise<ThemeSetting | null> {
    return ThemeSetting.findBy('theme_id', theme.id)
  }

  async template(theme: Theme, name: string): Promise<ThemeTemplate | null> {
    return ThemeTemplate.query().where('theme_id', theme.id).where('name', name).first()
  }

  async templates(theme: Theme): Promise<ThemeTemplate[]> {
    return ThemeTemplate.query().where('theme_id', theme.id).orderBy('name', 'asc')
  }

  async create(input: ThemeCreateInput): Promise<Theme> {
    return db.transaction(async (trx) => {
      const theme = await Theme.create(
        {
          key: input.manifest.key,
          name: input.name ?? input.manifest.name,
          version: input.manifest.version,
          author: input.manifest.author,
          description: input.manifest.description,
          role: 'unpublished',
          source: input.source,
          driveKey: input.driveKey,
          packageHash: input.packageHash,
          manifest: input.manifest,
          settingsSchema: input.settingsSchema,
          sectionSchemas: input.sectionSchemas,
          previewImage: input.manifest.previewImage,
          uploadedById: input.uploadedById,
        },
        { client: trx }
      )
      await ThemeSetting.create(
        { themeId: theme.id, data: input.settingsData, draftData: null },
        { client: trx }
      )
      for (const [name, data] of Object.entries(input.templates)) {
        await ThemeTemplate.create(
          { themeId: theme.id, name, data, draftData: null },
          { client: trx }
        )
      }
      return theme
    })
  }

  /** Copies a theme with its saved settings and templates; drafts are not copied. */
  async duplicate(source: Theme, name: string, uploadedById: string | null): Promise<Theme> {
    const [settings, templates] = await Promise.all([this.settings(source), this.templates(source)])
    return this.create({
      manifest: source.manifest,
      name,
      source: source.source,
      driveKey: source.driveKey,
      packageHash: source.packageHash,
      settingsSchema: source.settingsSchema,
      sectionSchemas: source.sectionSchemas,
      settingsData: settings?.data ?? { current: {}, sections: {} },
      templates: Object.fromEntries(templates.map((template) => [template.name, template.data])),
      uploadedById,
    })
  }

  async rename(theme: Theme, name: string): Promise<Theme> {
    theme.name = name
    await theme.save()
    return theme
  }

  /**
   * Makes `theme` the live theme. The previous live theme goes back to the
   * library in the same transaction, so the partial unique index on `role`
   * never sees two live rows.
   */
  async publish(theme: Theme): Promise<Theme> {
    await db.transaction(async (trx: TransactionClientContract) => {
      const current = await Theme.query({ client: trx }).where('role', 'live').forUpdate().first()
      if (current && current.id !== theme.id) {
        current.useTransaction(trx)
        current.role = 'unpublished'
        await current.save()
      }
      theme.useTransaction(trx)
      theme.role = 'live'
      theme.publishedAt = DateTime.now()
      await theme.save()
    })
    return theme
  }

  async unpublish(theme: Theme): Promise<Theme> {
    theme.role = 'unpublished'
    await theme.save()
    return theme
  }

  async delete(theme: Theme): Promise<void> {
    await theme.delete()
  }

  async updateSettingsDraft(theme: Theme, data: ThemeSettingsData): Promise<ThemeSetting> {
    const row = await ThemeSetting.findByOrFail('theme_id', theme.id)
    row.draftData = data
    await row.save()
    return row
  }

  async sourceDrafts(theme: Theme): Promise<ThemeSourceDraft[]> {
    return ThemeSourceDraft.query().where('theme_id', theme.id)
  }

  async sourceDraftMap(theme: Theme): Promise<Record<string, string>> {
    const rows = await this.sourceDrafts(theme)
    return Object.fromEntries(rows.map((row) => [row.path, row.content]))
  }

  async upsertSourceDraft(theme: Theme, path: string, content: string): Promise<ThemeSourceDraft> {
    const existing = await ThemeSourceDraft.query()
      .where('theme_id', theme.id)
      .where('path', path)
      .first()
    if (existing) {
      existing.content = content
      await existing.save()
      return existing
    }
    return ThemeSourceDraft.create({ themeId: theme.id, path, content })
  }

  async deleteSourceDrafts(theme: Theme, trx?: TransactionClientContract): Promise<void> {
    const query = ThemeSourceDraft.query()
    if (trx) query.useTransaction(trx)
    await query.where('theme_id', theme.id).delete()
  }

  async updateTemplateDraft(
    theme: Theme,
    name: string,
    data: ThemeTemplateData
  ): Promise<ThemeTemplate> {
    const row = await ThemeTemplate.query()
      .where('theme_id', theme.id)
      .where('name', name)
      .firstOrFail()
    row.draftData = data
    await row.save()
    return row
  }

  /** Copies every draft onto the published fields and clears drafts. */
  async commitDrafts(theme: Theme): Promise<void> {
    await db.transaction(async (trx) => {
      const settings = await ThemeSetting.query({ client: trx })
        .where('theme_id', theme.id)
        .forUpdate()
        .firstOrFail()
      if (settings.draftData) {
        settings.useTransaction(trx)
        settings.data = settings.draftData
        settings.draftData = null
        await settings.save()
      }
      const templates = await ThemeTemplate.query({ client: trx })
        .where('theme_id', theme.id)
        .forUpdate()
      for (const template of templates) {
        if (!template.draftData) continue
        template.useTransaction(trx)
        template.data = template.draftData
        template.draftData = null
        await template.save()
      }
    })
  }

  async discardDrafts(theme: Theme): Promise<void> {
    await db.transaction(async (trx) => {
      const settings = await ThemeSetting.query({ client: trx })
        .where('theme_id', theme.id)
        .forUpdate()
        .firstOrFail()
      if (settings.draftData) {
        settings.useTransaction(trx)
        settings.draftData = null
        await settings.save()
      }
      const templates = await ThemeTemplate.query({ client: trx })
        .where('theme_id', theme.id)
        .forUpdate()
      for (const template of templates) {
        if (!template.draftData) continue
        template.useTransaction(trx)
        template.draftData = null
        await template.save()
      }
      await this.deleteSourceDrafts(theme, trx)
    })
  }
}
