import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontFeatureService from '#services/storefront_feature_service'
import StorefrontFeatureTransformer from '#transformers/storefront_feature_transformer'

@inject()
export default class AdminStorefrontFeaturesListController {
  constructor(protected storefrontFeatureService: StorefrontFeatureService) {}

  async handle(ctx: HttpContext) {
    const features = await this.storefrontFeatureService.list()
    return ctx.serialize(StorefrontFeatureTransformer.transform(features))
  }
}
