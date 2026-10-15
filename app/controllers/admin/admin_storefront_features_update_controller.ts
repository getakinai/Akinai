import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontFeatureService from '#services/storefront_feature_service'
import StorefrontFeatureTransformer from '#transformers/storefront_feature_transformer'
import { adminStorefrontFeaturesUpdateValidator } from '#validators/admin_storefront_features_update_validator'

@inject()
export default class AdminStorefrontFeaturesUpdateController {
  constructor(protected storefrontFeatureService: StorefrontFeatureService) {}

  async handle(ctx: HttpContext) {
    const { items } = await ctx.request.validateUsing(adminStorefrontFeaturesUpdateValidator)
    const features = await this.storefrontFeatureService.replace(items)
    return ctx.serialize(StorefrontFeatureTransformer.transform(features))
  }
}
