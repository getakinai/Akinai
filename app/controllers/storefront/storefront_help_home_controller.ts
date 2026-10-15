import type { HttpContext } from '@adonisjs/core/http'

export default class StorefrontHelpHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('help/home', {})
  }
}
