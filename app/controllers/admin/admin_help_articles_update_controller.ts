import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticlePolicy from '#policies/help_article_policy'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'
import { adminHelpArticleUpdateValidator } from '#validators/admin_help_article_update_validator'

@inject()
export default class AdminHelpArticlesUpdateController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const article = await this.helpArticleService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(HelpArticlePolicy).authorize('update', article)

    const payload = await ctx.request.validateUsing(adminHelpArticleUpdateValidator)
    const updated = await this.helpArticleService.update(article, payload)

    return ctx.serialize(AdminHelpArticleTransformer.transform(updated))
  }
}
