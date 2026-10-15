import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SitemapService from '#services/sitemap_service'

/**
 * `robots.txt` for crawlers. Plain text in the robots format, so it is not
 * wrapped in `{ data }`.
 */
@inject()
export default class StorefrontRobotsShowController {
  constructor(protected sitemapService: SitemapService) {}

  async handle({ response }: HttpContext) {
    response.header('Content-Type', 'text/plain; charset=utf-8')
    response.header('Cache-Control', 'public, max-age=3600')
    return this.sitemapService.robots()
  }
}
