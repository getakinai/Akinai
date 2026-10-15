import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticleService from '#services/help_article_service'
import HelpMarkdownPreviewTransformer from '#transformers/help_markdown_preview_transformer'
import { adminHelpArticlePreviewValidator } from '#validators/admin_help_article_preview_validator'

@inject()
export default class AdminHelpArticlesPreviewController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const { markdown } = await ctx.request.validateUsing(adminHelpArticlePreviewValidator)
    const html = this.helpArticleService.preview(markdown)
    return ctx.serialize(HelpMarkdownPreviewTransformer.transform({ html }))
  }
}
