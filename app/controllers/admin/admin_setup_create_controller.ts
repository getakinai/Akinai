import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SetupService from '#services/setup_service'

@inject()
export default class AdminSetupCreateController {
  constructor(protected setupService: SetupService) {}

  async handle({ inertia, response }: HttpContext) {
    if (!(await this.setupService.isRequired())) {
      return response.redirect().toRoute('admin.session.create')
    }
    return inertia.render('admin/auth/setup', {})
  }
}
