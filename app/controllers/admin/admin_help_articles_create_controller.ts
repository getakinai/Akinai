import type { HttpContext } from '@adonisjs/core/http'

export default class AdminHelpArticlesCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/help/articles/create', {})
  }
}
