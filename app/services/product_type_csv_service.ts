import { inject } from '@adonisjs/core'
import type { Infer } from '@vinejs/vine/types'
import ProductType from '#models/product_type'
import ProductTypeRepository from '#repositories/product_type_repository'
import AuditLogService from '#services/audit_log_service'
import BaseNamedCsvService, { type NamedCsvData } from '#services/base_named_csv_service'
import { adminProductTypeImportRowValidator } from '#validators/admin_product_type_import_row_validator'
import type { adminProductTypesExportQueryValidator } from '#validators/admin_product_types_export_query_validator'

type Filters = Infer<typeof adminProductTypesExportQueryValidator>

@inject()
export default class ProductTypeCsvService extends BaseNamedCsvService<ProductType, Filters> {
  protected readonly noun = ['product type', 'product types'] as const
  protected readonly Model = ProductType
  protected readonly exportEvent = 'product_types_exported' as const
  protected readonly sampleNames = ['Gift box', 'Snacks'] as const

  constructor(
    auditLogService: AuditLogService,
    protected productTypeRepository: ProductTypeRepository
  ) {
    super(auditLogService)
  }

  protected validateRow(cells: Record<string, string>) {
    return adminProductTypeImportRowValidator.validate(cells)
  }

  protected existingKeys(keys: string[]) {
    return this.productTypeRepository.namesIn(keys)
  }

  protected fetchForExport(filters: Filters, limit: number) {
    return this.productTypeRepository.exportRows(
      {
        q: filters.q || undefined,
        status: filters.status,
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
      },
      limit
    )
  }

  protected createMany(data: NamedCsvData[]) {
    return this.productTypeRepository.createMany(data)
  }
}
