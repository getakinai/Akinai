import db from '@adonisjs/lucid/services/db'
import Media from '#models/media'
import { containsPattern, escapeLike } from '#repositories/helpers/like'

export type MediaData = {
  key: string
  folder: string
  contentType: string
  sizeBytes: number | null
  width: number | null
  height: number | null
  originalName: string | null
  uploadedById: string | null
}

export type PaginateMediaData = {
  q?: string
  folder?: string
  page: number
  perPage: number
}

export type MediaUsage = { type: string; label: string }

export default class MediaRepository {
  async paginate({ q, folder, page, perPage }: PaginateMediaData) {
    return Media.query()
      .preload('uploadedBy')
      .if(q, (query) =>
        query.where((inner) =>
          inner
            .whereILike('original_name', containsPattern(q))
            .orWhereILike('key', containsPattern(q))
        )
      )
      .if(folder, (query) =>
        query.where((inner) =>
          inner.where('folder', folder!).orWhereLike('folder', `${escapeLike(folder!)}/%`)
        )
      )
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<Media> {
    return Media.query().where('id', id).preload('uploadedBy').firstOrFail()
  }

  async create(data: MediaData): Promise<Media> {
    return Media.create(data)
  }

  async deleteByKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return
    await Media.query().whereIn('key', keys).delete()
  }

  /** Records whose image column points at `key`. */
  async usages(key: string): Promise<MediaUsage[]> {
    const [vendors, collections, themes, promoBanners, covers, gallery] = await Promise.all([
      db.from('vendors').where('image', key).select('name'),
      db.from('collections').where('image', key).select('title'),
      db.from('storefront_themes').where('logo_image', key).select('id'),
      db.from('storefront_promo_banners').where('image', key).select('title'),
      db.from('products').where('cover_image', key).select('title'),
      db
        .from('product_images')
        .join('products', 'products.id', 'product_images.product_id')
        .where('product_images.path', key)
        .select('products.title'),
    ])

    return [
      ...themes.map(() => ({ type: 'storefront_logo', label: 'Storefront logo' })),
      ...promoBanners.map((row) => ({ type: 'promo_banner', label: `Promo banner: ${row.title}` })),
      ...collections.map((row) => ({ type: 'collection', label: `Collection: ${row.title}` })),
      ...vendors.map((row) => ({ type: 'vendor', label: `Vendor: ${row.name}` })),
      ...[...covers, ...gallery].map((row) => ({
        type: 'product',
        label: `Product: ${row.title}`,
      })),
    ]
  }
}
