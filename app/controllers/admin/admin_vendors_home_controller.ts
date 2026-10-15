import type { HttpContext } from '@adonisjs/core/http'

export default class AdminVendorsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/vendors/home', {})
  }
}
