import { inject } from '@adonisjs/core'
import type ProductReview from '#models/product_review'
import type StorefrontFeature from '#models/storefront_feature'
import ProductReviewService from '#services/product_review_service'
import StorefrontFeatureService from '#services/storefront_feature_service'
import StorefrontPromoBannerService, {
  type StorefrontPromoBannersByPlacement,
} from '#services/storefront_promo_banner_service'

export type StorefrontHomeContent = {
  promoBanners: StorefrontPromoBannersByPlacement
  features: StorefrontFeature[]
  testimonials: ProductReview[]
}

/**
 * Admin-managed marketing sections of the home page: promo banners,
 * feature tiles and featured reviews.
 */
@inject()
export default class StorefrontHomeContentService {
  constructor(
    protected storefrontPromoBannerService: StorefrontPromoBannerService,
    protected storefrontFeatureService: StorefrontFeatureService,
    protected productReviewService: ProductReviewService
  ) {}

  async get(): Promise<StorefrontHomeContent> {
    const [promoBanners, features, testimonials] = await Promise.all([
      this.storefrontPromoBannerService.listPublic(),
      this.storefrontFeatureService.list(),
      this.productReviewService.listFeaturedPublic(),
    ])
    return { promoBanners, features, testimonials }
  }
}
