import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'

@inject()
export default class AdminHelpArticlesOptionsController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const articles = await this.helpArticleService.options()
    return ctx.serialize(AdminHelpArticleTransformer.transform(articles).useVariant('toOption'))
  }
}
