import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SitemapService from '#services/sitemap_service'

/**
 * `sitemap.xml` for search engines. Crawlers read this exact format, so it
 * is not wrapped in `{ data }`.
 */
@inject()
export default class StorefrontSitemapShowController {
  constructor(protected sitemapService: SitemapService) {}

  async handle({ response }: HttpContext) {
    const xml = await this.sitemapService.xml()
    response.header('Content-Type', 'application/xml; charset=utf-8')
    response.header('Cache-Control', 'public, max-age=3600')
    return xml
  }
}
