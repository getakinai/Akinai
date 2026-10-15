import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'

@inject()
export default class AdminHelpArticlesViewController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const article = await this.helpArticleService.findOrFail(ctx.params.id)
    return ctx.serialize(AdminHelpArticleTransformer.transform(article))
  }
}
