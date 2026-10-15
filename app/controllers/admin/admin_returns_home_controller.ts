import type { HttpContext } from '@adonisjs/core/http'
import { adminReturnsHomeQueryValidator } from '#validators/admin_returns_home_query_validator'

export default class AdminReturnsHomeController {
  async handle({ inertia, request }: HttpContext) {
    const [error, filters] = await adminReturnsHomeQueryValidator.tryValidate(request.qs())
    return inertia.render('admin/returns/home', {
      status: error ? '' : (filters.status ?? ''),
    })
  }
}
