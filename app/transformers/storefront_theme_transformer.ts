import type StorefrontTheme from '#models/storefront_theme'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { FAVICON_PREVIEW_FILE } from '#constants/branding'
import { imageUrl } from '#utils/image_url'

export default class StorefrontThemeTransformer extends BaseTransformer<StorefrontTheme> {
  protected colors() {
    return this.pick(this.resource, [
      'preset',
      'primaryColor',
      'primaryForegroundColor',
      'accentColor',
      'backgroundColor',
      'surfaceColor',
      'textColor',
    ])
  }

  protected content() {
    return {
      announcementText: this.resource.announcementText ?? null,
      announcementUrl: this.resource.announcementUrl ?? null,
      footerTagline: this.resource.footerTagline ?? null,
    }
  }

  protected logoUrl() {
    return this.resource.logoImage ? imageUrl(this.resource.logoImage) : null
  }

  toObject() {
    const { faviconFolder } = this.resource
    return {
      id: this.resource.id,
      ...this.colors(),
      brandName: this.resource.brandName,
      logoUrl: this.logoUrl(),
      faviconUrl: faviconFolder ? imageUrl(`${faviconFolder}/${FAVICON_PREVIEW_FILE}`) : null,
      ...this.content(),
      ...this.pick(this.resource, ['createdAt', 'updatedAt']),
    }
  }

  toPublic() {
    return {
      ...this.colors(),
      brandName: this.resource.brandName,
      logoUrl: this.logoUrl(),
      ...this.content(),
    }
  }
}
