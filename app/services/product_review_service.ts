import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import { HOME_TESTIMONIALS_LIMIT } from '#constants/storefront'
import type Customer from '#models/customer'
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from '#models/product_review'
import type ProductReview from '#models/product_review'
import ProductReviewRepository, {
  type ProductReviewData,
} from '#repositories/product_review_repository'
import StorefrontProductService from '#services/storefront_product_service'

export const PRODUCT_REVIEWS_PER_PAGE = 10

/** Staff see more featured reviews than the home page shows, to pick from. */
export const FEATURED_REVIEWS_ADMIN_LIMIT = 50

export type ProductReviewSummary = {
  average: number | null
  count: number
  distribution: { rating: number; count: number }[]
  viewerHasReviewed: boolean
}

const alreadyReviewed = () =>
  new errors.E_VALIDATION_ERROR([
    { field: 'body', message: 'You have already reviewed this product', rule: 'unique' },
  ])

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'

/**
 * Product reviews. Shoppers see visible reviews of active products; any
 * signed-in customer can post one review per product, published right
 * away. Staff can hide and unhide reviews.
 */
@inject()
export default class ProductReviewService {
  constructor(
    protected productReviewRepository: ProductReviewRepository,
    protected storefrontProductService: StorefrontProductService
  ) {}

  async paginateVisible(slug: string, page: number) {
    const productId = await this.storefrontProductService.findIdBySlugOrFail(slug)
    return this.productReviewRepository.paginateVisibleForProduct(
      productId,
      page,
      PRODUCT_REVIEWS_PER_PAGE
    )
  }

  /**
   * Average and per-star counts of visible reviews, and whether the
   * signed-in customer (if any) has already reviewed the product.
   */
  async summary(slug: string, customer: Customer | null): Promise<ProductReviewSummary> {
    const productId = await this.storefrontProductService.findIdBySlugOrFail(slug)
    const [rows, viewerHasReviewed] = await Promise.all([
      this.productReviewRepository.visibleRatingCounts(productId),
      customer
        ? this.productReviewRepository.existsForCustomer(productId, customer.id)
        : Promise.resolve(false),
    ])

    const byRating = new Map(rows.map((row) => [row.rating, row.count]))
    const count = rows.reduce((sum, row) => sum + row.count, 0)
    const total = rows.reduce((sum, row) => sum + row.rating * row.count, 0)
    const distribution = []
    for (let rating = REVIEW_RATING_MAX; rating >= REVIEW_RATING_MIN; rating--) {
      distribution.push({ rating, count: byRating.get(rating) ?? 0 })
    }

    return {
      average: count === 0 ? null : Math.round((total / count) * 10) / 10,
      count,
      distribution,
      viewerHasReviewed,
    }
  }

  async create(slug: string, customer: Customer, data: ProductReviewData): Promise<ProductReview> {
    const productId = await this.storefrontProductService.findIdBySlugOrFail(slug)
    if (await this.productReviewRepository.existsForCustomer(productId, customer.id)) {
      throw alreadyReviewed()
    }

    try {
      const review = await this.productReviewRepository.create(productId, customer.id, data)
      review.$setRelated('customer', customer)
      return review
    } catch (error) {
      if (isUniqueViolation(error)) throw alreadyReviewed()
      throw error
    }
  }

  async paginateForProduct(productId: string, page: number, perPage: number) {
    return this.productReviewRepository.paginateForProduct(productId, page, perPage)
  }

  async findForProductOrFail(productId: string, id: string): Promise<ProductReview> {
    return this.productReviewRepository.findForProductOrFail(productId, id)
  }

  /**
   * Hides/unhides and features/unfeatures a review. A hidden review can't
   * be featured, so hiding also unfeatures it, and featuring a hidden
   * review is rejected.
   */
  async setFlags(
    review: ProductReview,
    { isHidden, isFeatured }: { isHidden?: boolean; isFeatured?: boolean }
  ): Promise<ProductReview> {
    const hidden = isHidden ?? review.isHidden
    if (isFeatured && hidden) {
      throw new errors.E_VALIDATION_ERROR([
        { field: 'isFeatured', message: 'Unhide the review before featuring it', rule: 'hidden' },
      ])
    }
    return this.productReviewRepository.setFlags(review, {
      isHidden: hidden,
      isFeatured: hidden ? false : (isFeatured ?? review.isFeatured),
    })
  }

  async listFeatured(): Promise<ProductReview[]> {
    return this.productReviewRepository.listFeatured(FEATURED_REVIEWS_ADMIN_LIMIT)
  }

  async listFeaturedPublic(): Promise<ProductReview[]> {
    return this.productReviewRepository.listFeaturedPublic(HOME_TESTIMONIALS_LIMIT)
  }
}
