import ProductLabel, { type ProductLabelColor } from '#models/product_label'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type ProductLabelData = {
  name: string
  color: ProductLabelColor
}

export type ProductLabelSortKey = 'name' | 'productsCount' | 'createdAt'

export type PaginateProductLabelsData = {
  q?: string
  status?: 'active' | 'archived'
  sort: ProductLabelSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<ProductLabelSortKey, string> = {
  name: 'name',
  productsCount: 'products_count',
  createdAt: 'created_at',
}

export default class ProductLabelRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateProductLabelsData) {
    return ProductLabel.query()
      .withCount('products')
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<ProductLabel> {
    return ProductLabel.query().where('id', id).withCount('products').firstOrFail()
  }

  async allActive(): Promise<ProductLabel[]> {
    return ProductLabel.query().where('is_active', true).orderBy('name', 'asc')
  }

  async create(data: ProductLabelData): Promise<ProductLabel> {
    return ProductLabel.create({ isActive: true, ...data })
  }

  async update(productLabel: ProductLabel, data: ProductLabelData): Promise<ProductLabel> {
    return productLabel.merge(data).save()
  }

  async setActive(productLabel: ProductLabel, isActive: boolean): Promise<ProductLabel> {
    return productLabel.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the labels in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<ProductLabel[]> {
    return bulkUpdate(ProductLabel, ids, { isActive }, (query) =>
      query.where('is_active', !isActive)
    )
  }
}
