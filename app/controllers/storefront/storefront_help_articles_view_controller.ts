import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import HelpCenterService from '#services/help_center_service'
import HelpArticleTransformer from '#transformers/help_article_transformer'
import { storefrontHelpArticleSlugValidator } from '#validators/storefront_help_article_slug_validator'

@inject()
export default class StorefrontHelpArticlesViewController {
  constructor(protected helpCenterService: HelpCenterService) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontHelpArticleSlugValidator.tryValidate({
      category: ctx.params.category,
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const detail = await this.helpCenterService.findArticleOrFail(payload.category, payload.slug)
    return ctx.serialize(HelpArticleTransformer.transform(detail))
  }
}
