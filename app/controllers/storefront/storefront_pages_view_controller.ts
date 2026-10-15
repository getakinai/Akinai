import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import PageService from '#services/page_service'
import StorefrontPageTransformer from '#transformers/storefront_page_transformer'
import { storefrontPageSlugValidator } from '#validators/storefront_page_slug_validator'

@inject()
export default class StorefrontPagesViewController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontPageSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const page = await this.pageService.findPublicBySlugOrFail(payload.slug)
    return ctx.serialize(StorefrontPageTransformer.transform(page))
  }
}
