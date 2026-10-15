import db from '@adonisjs/lucid/services/db'
import ProductReview from '#models/product_review'

export type ProductReviewData = {
  rating: number
  title: string | null
  body: string
}

export type ProductReviewSummaryRow = { rating: number; count: number }

export default class ProductReviewRepository {
  /** Visible reviews of a product, newest first, with the author's name. */
  async paginateVisibleForProduct(productId: string, page: number, perPage: number) {
    return ProductReview.query()
      .select('id', 'customer_id', 'rating', 'title', 'body', 'created_at')
      .where('product_id', productId)
      .where('is_hidden', false)
      .preload('customer', (customer) => customer.select('id', 'full_name'))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /** Every review of a product (hidden included) for staff, newest first. */
  async paginateForProduct(productId: string, page: number, perPage: number) {
    return ProductReview.query()
      .where('product_id', productId)
      .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /** Count of visible reviews per star rating, in one grouped query. */
  async visibleRatingCounts(productId: string): Promise<ProductReviewSummaryRow[]> {
    const rows = await db
      .from('product_reviews')
      .select('rating')
      .count('* as count')
      .where('product_id', productId)
      .where('is_hidden', false)
      .groupBy('rating')
    return rows.map((row) => ({ rating: Number(row.rating), count: Number(row.count) }))
  }

  async existsForCustomer(productId: string, customerId: string): Promise<boolean> {
    const row = await ProductReview.query()
      .select('id')
      .where('product_id', productId)
      .where('customer_id', customerId)
      .first()
    return row !== null
  }

  async create(
    productId: string,
    customerId: string,
    data: ProductReviewData
  ): Promise<ProductReview> {
    return ProductReview.create({ ...data, productId, customerId, isHidden: false })
  }

  async findForProductOrFail(productId: string, id: string): Promise<ProductReview> {
    return ProductReview.query()
      .where('id', id)
      .where('product_id', productId)
      .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      .firstOrFail()
  }

  async setFlags(
    review: ProductReview,
    flags: { isHidden?: boolean; isFeatured?: boolean }
  ): Promise<ProductReview> {
    review.merge(flags)
    if (!review.$isDirty) return review
    return review.save()
  }

  /** Every featured review for staff, newest first, with product and author. */
  async listFeatured(limit: number): Promise<ProductReview[]> {
    return ProductReview.query()
      .where('is_featured', true)
      .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      .preload('product', (product) => product.select('id', 'title', 'slug', 'status'))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
  }

  /**
   * Featured, visible reviews of active products for the home page, newest
   * first. Only the columns shoppers see are loaded.
   */
  async listFeaturedPublic(limit: number): Promise<ProductReview[]> {
    return ProductReview.query()
      .select('id', 'product_id', 'customer_id', 'rating', 'title', 'body', 'created_at')
      .where('is_featured', true)
      .where('is_hidden', false)
      .whereHas('product', (product) => product.where('status', 'active'))
      .preload('customer', (customer) => customer.select('id', 'full_name'))
      .preload('product', (product) => product.select('id', 'title', 'slug'))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
  }
}
