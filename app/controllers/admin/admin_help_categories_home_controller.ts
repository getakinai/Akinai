import type { HttpContext } from '@adonisjs/core/http'

export default class AdminHelpCategoriesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/help/categories/home', {})
  }
}
