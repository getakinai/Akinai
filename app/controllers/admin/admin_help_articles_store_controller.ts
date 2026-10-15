import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'
import { adminHelpArticleStoreValidator } from '#validators/admin_help_article_store_validator'

@inject()
export default class AdminHelpArticlesStoreController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminHelpArticleStoreValidator)
    const article = await this.helpArticleService.create(payload)

    ctx.response.status(201)
    return ctx.serialize(AdminHelpArticleTransformer.transform(article))
  }
}
