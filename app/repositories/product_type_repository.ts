import db from '@adonisjs/lucid/services/db'
import ProductType from '#models/product_type'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'
import { lowerIn } from '#repositories/helpers/lower_in'

export type ProductTypeData = {
  name: string
}

export type ProductTypeSortKey = 'name' | 'productsCount' | 'createdAt'

export type PaginateProductTypesData = {
  q?: string
  status?: 'active' | 'archived'
  sort: ProductTypeSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<ProductTypeSortKey, string> = {
  name: 'name',
  productsCount: 'products_count',
  createdAt: 'created_at',
}

export default class ProductTypeRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateProductTypesData) {
    return ProductType.query()
      .withCount('products')
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async allActive(): Promise<ProductType[]> {
    return ProductType.query().where('is_active', true).orderBy('name', 'asc')
  }

  async findOrFail(id: string): Promise<ProductType> {
    return ProductType.query().where('id', id).withCount('products').firstOrFail()
  }

  async findByName(name: string): Promise<ProductType | null> {
    return ProductType.query().whereRaw('lower(name) = ?', [name.toLowerCase()]).first()
  }

  async activeByNames(names: string[]): Promise<ProductType[]> {
    if (names.length === 0) return []
    return ProductType.query()
      .whereRaw(...lowerIn('name', names))
      .where('is_active', true)
  }

  async exportRows(
    { q, status, sort, direction }: Omit<PaginateProductTypesData, 'page' | 'perPage'>,
    limit: number
  ): Promise<ProductType[]> {
    return ProductType.query()
      .select('id', 'name', 'is_active', 'created_at')
      .if(sort === 'productsCount', (query) => query.withCount('products'))
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .limit(limit)
  }

  /** Names from `names` that are taken (ignoring case), lowercased. */
  async namesIn(names: string[]): Promise<string[]> {
    if (names.length === 0) return []
    const rows = await ProductType.query()
      .whereRaw(...lowerIn('name', names))
      .select('name')
    return rows.map(({ name }) => name.toLowerCase())
  }

  async createMany(rows: (ProductTypeData & { isActive: boolean })[]): Promise<ProductType[]> {
    return db.transaction((trx) => ProductType.createMany(rows, { client: trx }))
  }

  async create(data: ProductTypeData): Promise<ProductType> {
    return ProductType.create({ isActive: true, ...data })
  }

  async update(productType: ProductType, data: ProductTypeData): Promise<ProductType> {
    return productType.merge(data).save()
  }

  async setActive(productType: ProductType, isActive: boolean): Promise<ProductType> {
    return productType.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the product types in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<ProductType[]> {
    return bulkUpdate(ProductType, ids, { isActive }, (query) =>
      query.where('is_active', !isActive)
    )
  }
}
