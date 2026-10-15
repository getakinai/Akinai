import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { storefrontHelpArticleSlugValidator } from '#validators/storefront_help_article_slug_validator'

export default class StorefrontHelpArticlesShowController {
  async handle({ inertia, params }: HttpContext) {
    const [error, payload] = await storefrontHelpArticleSlugValidator.tryValidate({
      category: params.category,
      slug: params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    return inertia.render('help/articles/show', {
      category: payload.category,
      slug: payload.slug,
    })
  }
}
