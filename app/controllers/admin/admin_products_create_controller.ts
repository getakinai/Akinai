import type { HttpContext } from '@adonisjs/core/http'

export default class AdminProductsCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/products/create', {})
  }
}
