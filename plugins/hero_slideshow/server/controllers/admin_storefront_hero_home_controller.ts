import type { HttpContext } from '@adonisjs/core/http'
import { pluginPage } from '#plugin_host/pages'

export default class AdminStorefrontHeroHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render(pluginPage('hero_slideshow', 'admin/hero'), {})
  }
}
