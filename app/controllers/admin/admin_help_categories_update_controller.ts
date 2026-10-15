import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryPolicy from '#policies/help_category_policy'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'
import { adminHelpCategoryUpdateValidator } from '#validators/admin_help_category_update_validator'

@inject()
export default class AdminHelpCategoriesUpdateController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const category = await this.helpCategoryService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(HelpCategoryPolicy).authorize('update', category)

    const payload = await ctx.request.validateUsing(adminHelpCategoryUpdateValidator)
    const updated = await this.helpCategoryService.update(category, payload)

    return ctx.serialize(AdminHelpCategoryTransformer.transform(updated))
  }
}
