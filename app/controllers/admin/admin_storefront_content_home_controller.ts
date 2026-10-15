import type { HttpContext } from '@adonisjs/core/http'

/** Content lives on the built-in theme page; keep this URL for old bookmarks. */
export default class AdminStorefrontContentHomeController {
  async handle({ response }: HttpContext) {
    return response.redirect().toRoute('admin.storefront_theme.home')
  }
}
