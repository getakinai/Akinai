import { inject } from '@adonisjs/core'
import type { Infer } from '@vinejs/vine/types'
import Vendor from '#models/vendor'
import VendorRepository from '#repositories/vendor_repository'
import AuditLogService from '#services/audit_log_service'
import BaseNamedCsvService, { type NamedCsvData } from '#services/base_named_csv_service'
import { adminVendorImportRowValidator } from '#validators/admin_vendor_import_row_validator'
import type { adminVendorsExportQueryValidator } from '#validators/admin_vendors_export_query_validator'

type Filters = Infer<typeof adminVendorsExportQueryValidator>

@inject()
export default class VendorCsvService extends BaseNamedCsvService<Vendor, Filters> {
  protected readonly noun = ['vendor', 'vendors'] as const
  protected readonly Model = Vendor
  protected readonly exportEvent = 'vendors_exported' as const
  protected readonly sampleNames = ['Acme Supply', 'Northwind Traders'] as const

  constructor(
    auditLogService: AuditLogService,
    protected vendorRepository: VendorRepository
  ) {
    super(auditLogService)
  }

  protected validateRow(cells: Record<string, string>) {
    return adminVendorImportRowValidator.validate(cells)
  }

  protected existingKeys(keys: string[]) {
    return this.vendorRepository.namesIn(keys)
  }

  protected fetchForExport(filters: Filters, limit: number) {
    return this.vendorRepository.exportRows(
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
    return this.vendorRepository.createMany(data)
  }
}
