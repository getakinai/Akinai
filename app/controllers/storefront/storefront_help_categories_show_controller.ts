import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { storefrontHelpCategorySlugValidator } from '#validators/storefront_help_category_slug_validator'

export default class StorefrontHelpCategoriesShowController {
  async handle({ inertia, params }: HttpContext) {
    const [error, payload] = await storefrontHelpCategorySlugValidator.tryValidate({
      category: params.category,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    return inertia.render('help/categories/show', { category: payload.category })
  }
}
