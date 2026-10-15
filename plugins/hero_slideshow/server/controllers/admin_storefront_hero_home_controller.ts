import type { HttpContext } from '@adonisjs/core/http'

/** Hero settings live on the built-in theme page; keep this URL for old bookmarks. */
export default class AdminStorefrontHeroHomeController {
  async handle({ response }: HttpContext) {
    return response.redirect().toRoute('admin.storefront_theme.home')
  }
}
