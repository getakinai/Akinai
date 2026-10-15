import type { HttpContext } from '@adonisjs/core/http'

export default class AdminHelpArticlesEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/help/articles/edit', { id: params.id })
  }
}
