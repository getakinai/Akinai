import { inject } from '@adonisjs/core'
import Location from '#models/location'
import LocationRepository, {
  type LocationData,
  type PaginateLocationsData,
} from '#repositories/location_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListLocationsFilters = Partial<PaginateLocationsData>

@inject()
export default class LocationService {
  constructor(
    protected locationRepository: LocationRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListLocationsFilters = {}) {
    return this.locationRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async allActive(): Promise<Location[]> {
    return this.locationRepository.allActive()
  }

  async findOrFail(id: string): Promise<Location> {
    return this.locationRepository.findOrFail(id)
  }

  async create(data: LocationData): Promise<Location> {
    return this.locationRepository.create(data)
  }

  async update(location: Location, data: LocationData): Promise<Location> {
    return this.locationRepository.update(location, data)
  }

  async archive(location: Location): Promise<Location> {
    return this.locationRepository.setActive(location, false)
  }

  async unarchive(location: Location): Promise<Location> {
    return this.locationRepository.setActive(location, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.locationRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(Location, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }

  async totalUnits(location: Location): Promise<number> {
    return this.locationRepository.totalUnits(location)
  }

  async findDefault(): Promise<Location | null> {
    return this.locationRepository.findDefault()
  }

  /**
   * Creates the default location when none exists yet.
   */
  async ensureDefault(name: string): Promise<Location> {
    const existing = await this.locationRepository.findDefault()
    if (existing) {
      return existing
    }
    return this.locationRepository.create({
      name,
      addressLine: null,
      city: null,
      country: null,
      isDefault: true,
    })
  }
}
