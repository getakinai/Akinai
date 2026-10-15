import type { HttpContext } from '@adonisjs/core/http'

export default class AdminProductLabelsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/product_labels/home', {})
  }
}
