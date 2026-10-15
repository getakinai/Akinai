import db from '@adonisjs/lucid/services/db'
import type { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder'

export type SitemapEntry = { slug: string; updatedAt: Date | null }

export type SitemapEntries = {
  products: SitemapEntry[]
  collections: SitemapEntry[]
  pages: SitemapEntry[]
}

export type SitemapLimits = { products: number; collections: number; pages: number }

/**
 * Public URLs for `sitemap.xml`: active products with at least one variant,
 * active collections and active (published) pages. Plain rows, not models,
 * since a sitemap can list tens of thousands of URLs.
 */
export default class SitemapRepository {
  async entries(limits: SitemapLimits): Promise<SitemapEntries> {
    const [products, collections, pages] = await Promise.all([
      this.latestActive('products', limits.products, (query) =>
        query.whereExists((variants) =>
          variants
            .from('product_variants')
            .select(db.raw('1'))
            .whereColumn('product_variants.product_id', 'products.id')
        )
      ),
      this.latestActive('collections', limits.collections),
      this.latestActive('pages', limits.pages),
    ])
    return { products, collections, pages }
  }

  /** Most recently updated first, so the limit drops the stalest URLs. */
  protected async latestActive(
    table: 'products' | 'collections' | 'pages',
    limit: number,
    scope: (query: DatabaseQueryBuilderContract) => DatabaseQueryBuilderContract = (query) => query
  ): Promise<SitemapEntry[]> {
    const rows = await scope(
      db
        .from(table)
        .select(`${table}.slug`, `${table}.updated_at`)
        .where(`${table}.status`, 'active')
    )
      .orderBy(`${table}.updated_at`, 'desc')
      .limit(limit)
    return rows.map((row) => ({
      slug: String(row.slug),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    }))
  }
}
