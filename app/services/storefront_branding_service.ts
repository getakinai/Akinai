import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { errors } from '@vinejs/vine'
import { v7 as uuidv7 } from 'uuid'
import type StorefrontTheme from '#models/storefront_theme'
import { FAVICON_FOLDER, LOGO_FOLDER } from '#constants/branding'
import StorefrontThemeRepository from '#repositories/storefront_theme_repository'
import StorefrontThemeService from '#services/storefront_theme_service'
import { FaviconSourceError, renderFavicons } from '#utils/favicon'
import { imageUrl } from '#utils/image_url'
import { deleteFolder, putFiles, uploadImage } from '#utils/uploader'

/**
 * Store logo and favicon. New files are written before the theme points at
 * them. Previous favicon sets are removed once the theme is saved; previous
 * logos stay in the media gallery.
 */
@inject()
export default class StorefrontBrandingService {
  constructor(
    protected storefrontThemeService: StorefrontThemeService,
    protected storefrontThemeRepository: StorefrontThemeRepository
  ) {}

  /** An empty name clears it, so the storefront falls back to the store name. */
  async setBrandName(brandName: string | null): Promise<StorefrontTheme> {
    const theme = await this.storefrontThemeService.get()
    return this.storefrontThemeRepository.update(theme, { brandName: brandName || null })
  }

  /** Replaced and removed logos stay in the media gallery. */
  async setLogo(file: MultipartFile): Promise<StorefrontTheme> {
    const theme = await this.storefrontThemeService.get()
    const { key } = await uploadImage(file, LOGO_FOLDER)
    return this.storefrontThemeRepository.update(theme, { logoImage: key })
  }

  async removeLogo(): Promise<StorefrontTheme> {
    const theme = await this.storefrontThemeService.get()
    if (!theme.logoImage) return theme
    return this.storefrontThemeRepository.update(theme, { logoImage: null })
  }

  async setFavicon(file: MultipartFile): Promise<StorefrontTheme> {
    const files = await this.render(file)
    const theme = await this.storefrontThemeService.get()
    const previous = theme.faviconFolder
    const folder = `${FAVICON_FOLDER}/${uuidv7()}`

    await putFiles(folder, files)
    const saved = await this.storefrontThemeRepository.update(theme, { faviconFolder: folder })
    if (previous) await deleteFolder(previous)
    return saved
  }

  async removeFavicon(): Promise<StorefrontTheme> {
    const theme = await this.storefrontThemeService.get()
    const previous = theme.faviconFolder
    if (!previous) return theme

    const saved = await this.storefrontThemeRepository.update(theme, { faviconFolder: null })
    await deleteFolder(previous)
    return saved
  }

  /**
   * Where a favicon file lives: the uploaded set, or the bundled default in
   * `public/favicons`. `null` when neither exists.
   */
  async faviconUrl(file: string): Promise<string | null> {
    const { faviconFolder } = await this.storefrontThemeService.get()
    if (faviconFolder) return imageUrl(`${faviconFolder}/${file}`)
    return existsSync(app.publicPath('favicons', file)) ? `/favicons/${file}` : null
  }

  private async render(file: MultipartFile) {
    try {
      if (!file.tmpPath) throw new FaviconSourceError('Upload the image again.')
      return await renderFavicons(await readFile(file.tmpPath))
    } catch (error) {
      if (!(error instanceof FaviconSourceError)) throw error
      throw new errors.E_VALIDATION_ERROR([
        { field: 'favicon', message: error.message, rule: 'favicon' },
      ])
    }
  }
}
