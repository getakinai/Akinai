import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'

@inject()
export default class AdminHelpCategoriesOptionsController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const categories = await this.helpCategoryService.options()
    return ctx.serialize(AdminHelpCategoryTransformer.transform(categories).useVariant('toOption'))
  }
}
