import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryPolicy from '#policies/help_category_policy'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'

@inject()
export default class AdminHelpCategoriesUnarchiveController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const category = await this.helpCategoryService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(HelpCategoryPolicy).authorize('unarchive', category)

    const updated = await this.helpCategoryService.unarchive(category)
    return ctx.serialize(AdminHelpCategoryTransformer.transform(updated))
  }
}
