import type { HttpContext } from '@adonisjs/core/http'

export default class AdminProductTypesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/product_types/home', {})
  }
}
