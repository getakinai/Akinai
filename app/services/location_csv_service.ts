import { inject } from '@adonisjs/core'
import type { Infer } from '@vinejs/vine/types'
import Location from '#models/location'
import LocationRepository, { type LocationData } from '#repositories/location_repository'
import AuditLogService from '#services/audit_log_service'
import BaseCsvTransferService from '#services/base_csv_transfer_service'
import { adminLocationImportRowValidator } from '#validators/admin_location_import_row_validator'
import type { adminLocationsExportQueryValidator } from '#validators/admin_locations_export_query_validator'

export const LOCATION_CSV_COLUMNS = ['name', 'address_line', 'city', 'country', 'status'] as const

type Column = (typeof LOCATION_CSV_COLUMNS)[number]
type Row = Infer<typeof adminLocationImportRowValidator>
type CreateData = LocationData & { isActive: boolean }
type Filters = Infer<typeof adminLocationsExportQueryValidator>

/** Locations as CSV, one row per location. The name is the unique key. */
@inject()
export default class LocationCsvService extends BaseCsvTransferService<
  Column,
  Row,
  CreateData,
  Location,
  Filters
> {
  protected readonly columns = LOCATION_CSV_COLUMNS
  protected readonly noun = ['location', 'locations'] as const
  protected readonly keyColumn = 'name' as const
  protected readonly lowercaseColumns = ['status'] as const
  protected readonly Model = Location
  protected readonly exportEvent = 'locations_exported' as const

  constructor(
    auditLogService: AuditLogService,
    protected locationRepository: LocationRepository
  ) {
    super(auditLogService)
  }

  protected async sampleRows(suffix: string) {
    return [
      {
        name: `Main warehouse ${suffix}`,
        address_line: '123 Rizal Avenue',
        city: 'Manila',
        country: 'Philippines',
        status: 'active',
      },
      {
        name: `Pop-up store ${suffix}`,
        address_line: '',
        city: 'Cebu City',
        country: 'Philippines',
        status: 'archived',
      },
    ]
  }

  protected validateRow(cells: Record<string, string>) {
    return adminLocationImportRowValidator.validate(cells)
  }

  protected keyOf(row: Row) {
    return row.name
  }

  protected existingKeys(keys: string[]) {
    return this.locationRepository.namesIn(keys)
  }

  protected fetchForExport(filters: Filters, limit: number) {
    return this.locationRepository.exportRows(
      {
        q: filters.q || undefined,
        status: filters.status,
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
      },
      limit
    )
  }

  protected toCsvRow(location: Location) {
    return {
      name: location.name,
      address_line: location.addressLine ?? '',
      city: location.city ?? '',
      country: location.country ?? '',
      status: location.isActive ? 'active' : 'archived',
    }
  }

  protected build(row: Row): CreateData {
    return {
      name: row.name,
      addressLine: row.address_line ?? null,
      city: row.city ?? null,
      country: row.country ?? null,
      isActive: row.status !== 'archived',
    }
  }

  protected createMany(data: CreateData[]) {
    return this.locationRepository.createMany(data)
  }
}
