import { inject } from '@adonisjs/core'
import ProductType from '#models/product_type'
import ProductTypeRepository, {
  type PaginateProductTypesData,
  type ProductTypeData,
} from '#repositories/product_type_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListProductTypesFilters = Partial<PaginateProductTypesData>

@inject()
export default class ProductTypeService {
  constructor(
    protected productTypeRepository: ProductTypeRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListProductTypesFilters = {}) {
    return this.productTypeRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async allActive(): Promise<ProductType[]> {
    return this.productTypeRepository.allActive()
  }

  async findOrFail(id: string): Promise<ProductType> {
    return this.productTypeRepository.findOrFail(id)
  }

  async create(data: ProductTypeData): Promise<ProductType> {
    return this.productTypeRepository.create({ name: data.name.trim() })
  }

  async update(productType: ProductType, data: ProductTypeData): Promise<ProductType> {
    return this.productTypeRepository.update(productType, { name: data.name.trim() })
  }

  /**
   * Creates the product type unless one with the same name (any case) exists.
   */
  async ensure(name: string): Promise<ProductType> {
    const existing = await this.productTypeRepository.findByName(name.trim())
    return existing ?? this.create({ name })
  }

  async archive(productType: ProductType): Promise<ProductType> {
    return this.productTypeRepository.setActive(productType, false)
  }

  async unarchive(productType: ProductType): Promise<ProductType> {
    return this.productTypeRepository.setActive(productType, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.productTypeRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(ProductType, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }
}
