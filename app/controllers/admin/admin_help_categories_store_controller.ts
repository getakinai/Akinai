import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCategoryService from '#services/help_category_service'
import AdminHelpCategoryTransformer from '#transformers/admin_help_category_transformer'
import { adminHelpCategoryStoreValidator } from '#validators/admin_help_category_store_validator'

@inject()
export default class AdminHelpCategoriesStoreController {
  constructor(protected helpCategoryService: HelpCategoryService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminHelpCategoryStoreValidator)
    const category = await this.helpCategoryService.create(payload)

    ctx.response.status(201)
    return ctx.serialize(AdminHelpCategoryTransformer.transform(category))
  }
}
