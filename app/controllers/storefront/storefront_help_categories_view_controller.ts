import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import HelpCenterService from '#services/help_center_service'
import HelpCategoryTransformer from '#transformers/help_category_transformer'
import { storefrontHelpCategorySlugValidator } from '#validators/storefront_help_category_slug_validator'

@inject()
export default class StorefrontHelpCategoriesViewController {
  constructor(protected helpCenterService: HelpCenterService) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontHelpCategorySlugValidator.tryValidate({
      category: ctx.params.category,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const detail = await this.helpCenterService.findCategoryOrFail(payload.category)
    return ctx.serialize(HelpCategoryTransformer.transform(detail))
  }
}
