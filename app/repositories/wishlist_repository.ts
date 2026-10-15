import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Product from '#models/product'
import WishlistItem, { MAX_WISHLIST_ITEMS } from '#models/wishlist_item'

export type WishlistAddResult = 'added' | 'exists' | 'full'

/** Only active products, so archived or draft ones drop out of the list. */
const activeProduct = (product: ModelQueryBuilderContract<typeof Product>) =>
  product.where('status', 'active')

export default class WishlistRepository {
  async isActiveProduct(productId: string): Promise<boolean> {
    const product = await Product.query()
      .select('id')
      .where('id', productId)
      .where('status', 'active')
      .first()
    return product !== null
  }

  /** Ids of the active products the customer saved, newest first. */
  async productIdsFor(customerId: string): Promise<string[]> {
    const rows = await WishlistItem.query()
      .select('product_id')
      .where('customer_id', customerId)
      .whereHas('product', activeProduct)
      .orderBy('created_at', 'desc')
      .limit(MAX_WISHLIST_ITEMS)
    return rows.map(({ productId }) => productId)
  }

  /** One page of saved active product ids, newest first. */
  async paginateProductIdsFor(customerId: string, page: number, perPage: number) {
    const result = await WishlistItem.query()
      .select('id', 'product_id', 'created_at')
      .where('customer_id', customerId)
      .whereHas('product', activeProduct)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
    return { ids: result.all().map(({ productId }) => productId), meta: result.getMeta() }
  }

  /**
   * Saves the product unless it is already saved or the wishlist is full.
   * The customer row is locked so two requests can't both pass the limit.
   */
  async add(customerId: string, productId: string): Promise<WishlistAddResult> {
    return db.transaction(async (trx) => {
      await trx.from('customers').select('id').where('id', customerId).forUpdate().first()

      const existing = await WishlistItem.query({ client: trx })
        .select('id')
        .where('customer_id', customerId)
        .where('product_id', productId)
        .first()
      if (existing) return 'exists'

      const counted = await trx
        .from('wishlist_items')
        .where('customer_id', customerId)
        .count('* as total')
        .first()
      if (Number(counted?.total ?? 0) >= MAX_WISHLIST_ITEMS) return 'full'

      await WishlistItem.create({ customerId, productId }, { client: trx })
      return 'added'
    })
  }

  async findForCustomer(customerId: string, productId: string): Promise<WishlistItem | null> {
    return WishlistItem.query()
      .where('customer_id', customerId)
      .where('product_id', productId)
      .first()
  }

  /** Model delete so the removal shows in the customer's activity. */
  async remove(item: WishlistItem): Promise<void> {
    await item.delete()
  }
}
