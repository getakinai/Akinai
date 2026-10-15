import { inject } from '@adonisjs/core'
import ProductLabel from '#models/product_label'
import ProductLabelRepository, {
  type PaginateProductLabelsData,
  type ProductLabelData,
} from '#repositories/product_label_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListProductLabelsFilters = Partial<PaginateProductLabelsData>

@inject()
export default class ProductLabelService {
  constructor(
    protected productLabelRepository: ProductLabelRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListProductLabelsFilters = {}) {
    return this.productLabelRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<ProductLabel> {
    return this.productLabelRepository.findOrFail(id)
  }

  async create(data: ProductLabelData): Promise<ProductLabel> {
    return this.productLabelRepository.create({ name: data.name.trim(), color: data.color })
  }

  async update(productLabel: ProductLabel, data: ProductLabelData): Promise<ProductLabel> {
    return this.productLabelRepository.update(productLabel, {
      name: data.name.trim(),
      color: data.color,
    })
  }

  async archive(productLabel: ProductLabel): Promise<ProductLabel> {
    return this.productLabelRepository.setActive(productLabel, false)
  }

  async unarchive(productLabel: ProductLabel): Promise<ProductLabel> {
    return this.productLabelRepository.setActive(productLabel, true)
  }

  /**
   * Archives or unarchives many labels at once. Labels already in that
   * state are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.productLabelRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(ProductLabel, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }
}
