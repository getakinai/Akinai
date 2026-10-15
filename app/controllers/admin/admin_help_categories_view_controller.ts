import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'

@inject()
export default class AdminHelpCategoriesViewController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const category = await this.helpCategoryService.findOrFail(ctx.params.id)
    return ctx.serialize(AdminHelpCategoryTransformer.transform(category))
  }
}
