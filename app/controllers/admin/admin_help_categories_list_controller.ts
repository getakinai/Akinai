import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'
import { adminHelpCategoriesListQueryValidator } from '#validators/admin_help_categories_list_query_validator'

@inject()
export default class AdminHelpCategoriesListController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminHelpCategoriesListQueryValidator,
      { data: ctx.request.qs() }
    )
    const categories = await this.helpCategoryService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(
      AdminHelpCategoryTransformer.paginate(categories.all(), categories.getMeta())
    )
  }
}
