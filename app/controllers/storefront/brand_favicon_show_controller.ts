import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontBrandingService from '#services/storefront_branding_service'
import { brandFaviconShowValidator } from '#validators/brand_favicon_show_validator'

/**
 * Stable favicon URLs for `<link>` tags. Redirects to the uploaded icon, or
 * to the bundled default when none is uploaded.
 */
@inject()
export default class BrandFaviconShowController {
  constructor(protected storefrontBrandingService: StorefrontBrandingService) {}

  async handle({ params, response }: HttpContext) {
    const [error, payload] = await brandFaviconShowValidator.tryValidate({ file: params.file })
    if (error) return response.notFound()

    const url = await this.storefrontBrandingService.faviconUrl(payload.file)
    if (!url) return response.notFound()

    response.header('Cache-Control', 'public, max-age=300')
    return response.redirect(url)
  }
}
