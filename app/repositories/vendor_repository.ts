import db from '@adonisjs/lucid/services/db'
import Vendor from '#models/vendor'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'
import { lowerIn } from '#repositories/helpers/lower_in'

export type VendorData = {
  name: string
}

export type VendorSortKey = 'name' | 'productsCount' | 'createdAt'

export type PaginateVendorsData = {
  q?: string
  status?: 'active' | 'archived'
  sort: VendorSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<VendorSortKey, string> = {
  name: 'name',
  productsCount: 'products_count',
  createdAt: 'created_at',
}

export default class VendorRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateVendorsData) {
    return Vendor.query()
      .withCount('products')
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async allActive(): Promise<Vendor[]> {
    return Vendor.query().where('is_active', true).orderBy('name', 'asc')
  }

  async findOrFail(id: string): Promise<Vendor> {
    return Vendor.query().where('id', id).withCount('products').firstOrFail()
  }

  async findByName(name: string): Promise<Vendor | null> {
    return Vendor.query().whereRaw('lower(name) = ?', [name.toLowerCase()]).first()
  }

  async activeByNames(names: string[]): Promise<Vendor[]> {
    if (names.length === 0) return []
    return Vendor.query()
      .whereRaw(...lowerIn('name', names))
      .where('is_active', true)
  }

  async exportRows(
    { q, status, sort, direction }: Omit<PaginateVendorsData, 'page' | 'perPage'>,
    limit: number
  ): Promise<Vendor[]> {
    return Vendor.query()
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
    const rows = await Vendor.query()
      .whereRaw(...lowerIn('name', names))
      .select('name')
    return rows.map(({ name }) => name.toLowerCase())
  }

  async createMany(rows: (VendorData & { isActive: boolean })[]): Promise<Vendor[]> {
    return db.transaction((trx) => Vendor.createMany(rows, { client: trx }))
  }

  async create(data: VendorData): Promise<Vendor> {
    return Vendor.create({ isActive: true, ...data })
  }

  async update(vendor: Vendor, data: VendorData): Promise<Vendor> {
    return vendor.merge(data).save()
  }

  async setImage(vendor: Vendor, image: string | null): Promise<Vendor> {
    return vendor.merge({ image }).save()
  }

  async setActive(vendor: Vendor, isActive: boolean): Promise<Vendor> {
    return vendor.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the vendors in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<Vendor[]> {
    return bulkUpdate(Vendor, ids, { isActive }, (query) => query.where('is_active', !isActive))
  }
}
