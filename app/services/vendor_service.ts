import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { VENDOR_IMAGE_FOLDER } from '#constants/storefront'
import Vendor from '#models/vendor'
import VendorRepository, {
  type PaginateVendorsData,
  type VendorData,
} from '#repositories/vendor_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { deleteImages, uploadImage } from '#utils/uploader'

export type ListVendorsFilters = Partial<PaginateVendorsData>

@inject()
export default class VendorService {
  constructor(
    protected vendorRepository: VendorRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListVendorsFilters = {}) {
    return this.vendorRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async allActive(): Promise<Vendor[]> {
    return this.vendorRepository.allActive()
  }

  async findOrFail(id: string): Promise<Vendor> {
    return this.vendorRepository.findOrFail(id)
  }

  async create(data: VendorData): Promise<Vendor> {
    return this.vendorRepository.create({ name: data.name.trim() })
  }

  async update(vendor: Vendor, data: VendorData): Promise<Vendor> {
    return this.vendorRepository.update(vendor, { name: data.name.trim() })
  }

  /**
   * Creates the vendor unless one with the same name (any case) exists.
   */
  async ensure(name: string): Promise<Vendor> {
    const existing = await this.vendorRepository.findByName(name.trim())
    return existing ?? this.create({ name })
  }

  /**
   * The new file is written before the vendor points at it, and the
   * previous file is removed only after the vendor is saved.
   */
  async setImage(vendor: Vendor, file: MultipartFile): Promise<Vendor> {
    const previous = vendor.image
    const { key } = await uploadImage(file, VENDOR_IMAGE_FOLDER)
    const saved = await this.vendorRepository.setImage(vendor, key)
    if (previous) await deleteImages([previous])
    return saved
  }

  async removeImage(vendor: Vendor): Promise<Vendor> {
    const previous = vendor.image
    if (!previous) return vendor
    const saved = await this.vendorRepository.setImage(vendor, null)
    await deleteImages([previous])
    return saved
  }

  async archive(vendor: Vendor): Promise<Vendor> {
    return this.vendorRepository.setActive(vendor, false)
  }

  async unarchive(vendor: Vendor): Promise<Vendor> {
    return this.vendorRepository.setActive(vendor, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.vendorRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(Vendor, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }
}
