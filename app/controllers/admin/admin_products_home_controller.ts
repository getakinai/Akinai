import type { HttpContext } from '@adonisjs/core/http'

export default class AdminProductsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/products/home', {})
  }
}
