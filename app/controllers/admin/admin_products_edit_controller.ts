import type { HttpContext } from '@adonisjs/core/http'

export default class AdminProductsEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/products/edit', { id: params.id })
  }
}
