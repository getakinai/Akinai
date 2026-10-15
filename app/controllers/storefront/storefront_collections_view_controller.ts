import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontCollectionService from '#services/storefront_collection_service'
import StorefrontCollectionTransformer from '#transformers/storefront_collection_transformer'
import { storefrontCollectionSlugValidator } from '#validators/storefront_collection_slug_validator'

@inject()
export default class StorefrontCollectionsViewController {
  constructor(protected storefrontCollectionService: StorefrontCollectionService) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontCollectionSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const collection = await this.storefrontCollectionService.findBySlugOrFail(payload.slug)
    return ctx.serialize(StorefrontCollectionTransformer.transform(collection))
  }
}
