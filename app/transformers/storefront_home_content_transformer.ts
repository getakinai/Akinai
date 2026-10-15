import type { StorefrontHomeContent } from '#services/storefront_home_content_service'
import StorefrontFeatureTransformer from '#transformers/storefront_feature_transformer'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'
import StorefrontTestimonialTransformer from '#transformers/storefront_testimonial_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class StorefrontHomeContentTransformer extends BaseTransformer<StorefrontHomeContent> {
  toObject() {
    const { promoBanners, features, testimonials } = this.resource

    return {
      middleBanners: StorefrontPromoBannerTransformer.transform(
        promoBanners.home_middle
      ).useVariant('toPublic'),
      bottomBanners: StorefrontPromoBannerTransformer.transform(
        promoBanners.home_bottom
      ).useVariant('toPublic'),
      features: StorefrontFeatureTransformer.transform(features),
      testimonials: StorefrontTestimonialTransformer.transform(testimonials),
    }
  }
}
