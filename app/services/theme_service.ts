import { existsSync, readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import BusinessRuleException from '#exceptions/business_rule_exception'
import ThemePackageException from '#exceptions/theme_package_exception'
import { MAX_THEME_PACKAGE_MB, type ThemeSource } from '#constants/themes'
import type Theme from '#models/theme'
import ThemeRepository from '#repositories/theme_repository'
import { packThemeFolder, readThemePackage, repackTheme } from '#theme_host/package'
import { deleteThemeZip, loadThemePackage, storeThemeZip } from '#theme_host/storage'

/**
 * The theme library: uploading, duplicating, publishing and removing
 * storefront themes. Bundled themes (`themes/<key>/`) are added to the
 * library the first time it is listed.
 */
@inject()
export default class ThemeService {
  constructor(protected themeRepository: ThemeRepository) {}

  async library(): Promise<Theme[]> {
    await this.installBundled()
    return this.themeRepository.all()
  }

  async findOrFail(id: string): Promise<Theme> {
    return this.themeRepository.findOrFail(id)
  }

  async live(): Promise<Theme | null> {
    return this.themeRepository.live()
  }

  async upload(zipPath: string, uploadedById: string | null): Promise<Theme> {
    const zip = new Uint8Array(await readFile(zipPath))
    if (zip.length > MAX_THEME_PACKAGE_MB * 1024 * 1024) {
      throw new ThemePackageException([`Theme files may be at most ${MAX_THEME_PACKAGE_MB} MB`])
    }
    return this.install(zip, 'upload', uploadedById)
  }

  async duplicate(id: string, uploadedById: string | null): Promise<Theme> {
    const theme = await this.themeRepository.findOrFail(id)
    return this.themeRepository.duplicate(
      theme,
      `Copy of ${theme.name}`.slice(0, 120),
      uploadedById
    )
  }

  async rename(id: string, name: string): Promise<Theme> {
    return this.themeRepository.rename(await this.themeRepository.findOrFail(id), name)
  }

  async publish(id: string): Promise<Theme> {
    return this.themeRepository.publish(await this.themeRepository.findOrFail(id))
  }

  /** Takes the live theme down; the storefront goes back to the built-in theme. */
  async unpublish(id: string): Promise<Theme> {
    const theme = await this.themeRepository.findOrFail(id)
    if (theme.role !== 'live') throw new BusinessRuleException('This theme is not live')
    return this.themeRepository.unpublish(theme)
  }

  async delete(id: string): Promise<void> {
    const theme = await this.themeRepository.findOrFail(id)
    if (theme.role === 'live') {
      throw new BusinessRuleException('Publish another theme before deleting the live theme')
    }
    const shared = await this.themeRepository.isDriveKeyShared(theme.driveKey, theme.id)
    await this.themeRepository.delete(theme)
    if (!shared) await deleteThemeZip(theme.driveKey)
  }

  /** The theme package with its current settings, ready to upload elsewhere. */
  async download(id: string): Promise<{ filename: string; contents: Uint8Array }> {
    const theme = await this.themeRepository.findOrFail(id)
    const [pkg, settings, templates] = await Promise.all([
      loadThemePackage(theme),
      this.themeRepository.settings(theme),
      this.themeRepository.templates(theme),
    ])
    const contents = repackTheme(
      pkg,
      settings?.data ?? pkg.settingsData,
      Object.fromEntries(templates.map((template) => [template.name, template.data]))
    )
    const slug =
      theme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || theme.key
    return { filename: `${slug}-${theme.version}.zip`, contents }
  }

  /**
   * Adds each bundled theme folder to the library, and moves bundled themes
   * (and their copies) onto the folder's latest files when it changes.
   */
  async installBundled(): Promise<void> {
    const root = app.makePath('themes')
    if (!existsSync(root)) return
    const folders = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, 'theme.json')))
      .map((entry) => entry.name)
    for (const folder of folders) {
      const zip = await packThemeFolder(join(root, folder))
      const pkg = readThemePackage(zip)
      if (pkg.manifest.key !== folder) {
        throw new Error(`Theme folder "${folder}" must match theme.json key "${pkg.manifest.key}"`)
      }
      const installed = await this.themeRepository.findBySource(folder, 'bundled')
      if (installed.length === 0) {
        await this.install(zip, 'bundled', null)
        continue
      }
      const stale = installed.filter((theme) => theme.packageHash !== pkg.hash)
      if (stale.length === 0) continue
      const oldKeys = new Set(stale.map((theme) => theme.driveKey))
      await this.themeRepository.updatePackage(stale, {
        manifest: pkg.manifest,
        driveKey: await storeThemeZip(pkg.hash, zip),
        packageHash: pkg.hash,
        settingsSchema: pkg.settingsSchema,
        sectionSchemas: pkg.sectionSchemas,
        templates: pkg.templates,
      })
      for (const driveKey of oldKeys) {
        if (!(await this.themeRepository.isDriveKeyUsed(driveKey))) {
          await deleteThemeZip(driveKey)
        }
      }
    }
  }

  protected async install(zip: Uint8Array, source: ThemeSource, uploadedById: string | null) {
    const pkg = readThemePackage(zip)
    const driveKey = await storeThemeZip(pkg.hash, zip)
    return this.themeRepository.create({
      manifest: pkg.manifest,
      source,
      driveKey,
      packageHash: pkg.hash,
      settingsSchema: pkg.settingsSchema,
      sectionSchemas: pkg.sectionSchemas,
      settingsData: pkg.settingsData,
      templates: pkg.templates,
      uploadedById,
    })
  }
}
