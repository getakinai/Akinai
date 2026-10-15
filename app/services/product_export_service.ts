import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { MAX_EXPORT_ROWS } from '#constants/csv_transfer'
import { PRODUCT_IMPORT_COLUMNS, type ProductImportColumn } from '#constants/product_import'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type Product from '#models/product'
import ProductRepository, { type ProductSortKey } from '#repositories/product_repository'
import type { ProductStatus } from '#models/product'
import ProductSearchService from '#services/product_search_service'
import { toCsv } from '#utils/csv'

export type ExportProductsFilters = {
  q?: string
  status?: ProductStatus
  sort?: ProductSortKey
  direction?: 'asc' | 'desc'
}

export type ProductExport = {
  filename: string
  csv: string
  productCount: number
}

type ExportRow = Record<ProductImportColumn, string>

const OPTION_SLOTS = [1, 2, 3] as const

const TOO_MANY = 'Too many products to export. Narrow the search or filter.'

const money = (value: number | null) => (value === null ? '' : value.toFixed(2))

const emptyRow = (): ExportRow =>
  Object.fromEntries(PRODUCT_IMPORT_COLUMNS.map((column) => [column, ''])) as ExportRow

/**
 * Exports products as a CSV in the import format: one row per variant,
 * product fields on the first row only. Archived products are written as
 * `draft`, the import only accepts draft and active.
 */
@inject()
export default class ProductExportService {
  constructor(
    protected productRepository: ProductRepository,
    protected productSearchService: ProductSearchService
  ) {}

  async exportCsv(filters: ExportProductsFilters = {}): Promise<ProductExport> {
    const q = filters.q?.trim() || undefined
    const searchIds = q ? await this.productSearchService.matchingIds(q, filters.status) : null
    const products = await this.productRepository.exportRows({
      q,
      searchIds,
      status: filters.status,
      sort: filters.sort ?? 'updatedAt',
      direction: filters.direction ?? 'desc',
      limit: MAX_EXPORT_ROWS + 1,
    })
    if (products.length > MAX_EXPORT_ROWS) throw new BusinessRuleException(TOO_MANY)

    const rows = products.flatMap((product) => this.rows(product))
    if (rows.length > MAX_EXPORT_ROWS) throw new BusinessRuleException(TOO_MANY)

    return {
      filename: `products-${DateTime.now().toISODate()}.csv`,
      csv: toCsv(PRODUCT_IMPORT_COLUMNS, rows),
      productCount: products.length,
    }
  }

  protected rows(product: Product): ExportRow[] {
    const slots = new Map(
      product.options
        .slice(0, OPTION_SLOTS.length)
        .map((option, index) => [option.id, { slot: OPTION_SLOTS[index], name: option.name }])
    )

    return product.variants.map((variant, index) => {
      const row = emptyRow()
      row.handle = product.slug

      if (index === 0) {
        row.title = product.title
        row.description = product.description ?? ''
        row.status = product.status === 'active' ? 'active' : 'draft'
        row.vendor = product.vendor?.name ?? ''
        row.product_type = product.productType?.name ?? ''
        row.tags = product.tags.map(({ name }) => name).join(', ')
        row.charge_tax = String(product.chargeTax)
        row.seo_title = product.seoTitle ?? ''
        row.seo_description = product.seoDescription ?? ''
        for (const { slot, name } of slots.values()) row[`option${slot}_name`] = name
      }

      for (const value of variant.optionValues) {
        const option = slots.get(value.productOptionId)
        if (option) row[`option${option.slot}_value`] = value.value
      }

      row.sku = variant.sku ?? ''
      row.barcode = variant.barcode ?? ''
      row.price = money(variant.price)
      row.compare_at_price = money(variant.compareAtPrice)
      row.track_inventory = String(variant.trackInventory)
      row.inventory_quantity = variant.trackInventory
        ? String(Math.max(0, Number(variant.$extras.available_total ?? 0)))
        : ''
      return row
    })
  }
}
