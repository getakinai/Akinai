import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import type Location from '#models/location'
import Product, { type ProductStatus } from '#models/product'
import type ProductVariant from '#models/product_variant'
import LocationRepository from '#repositories/location_repository'
import OptionDefinitionRepository, {
  type ResolvedCatalogOption,
} from '#repositories/option_definition_repository'
import type { BulkStatusSource } from '#repositories/helpers/bulk_update'
import type { VariantMarketPriceData } from '#repositories/price_repository'
import type ProductLabel from '#models/product_label'
import type ProductType from '#models/product_type'
import type Vendor from '#models/vendor'
import ProductLabelRepository from '#repositories/product_label_repository'
import ProductRepository, {
  type KeptVariantData,
  type NewVariantData,
  type PaginateProductsData,
  type ProductData,
} from '#repositories/product_repository'
import ProductTypeRepository from '#repositories/product_type_repository'
import VendorRepository from '#repositories/vendor_repository'
import {
  buildCombinations,
  combinationKey,
  DEFAULT_VARIANT_TITLE,
  type OptionInput,
  type OptionPair,
} from '#services/variant_combinations'
import AuditLogService from '#services/audit_log_service'
import PriceService from '#services/price_service'
import { blankToNull } from '#utils/blank_to_null'
import { sanitizeEditorHtml } from '#utils/sanitize_rich_text'
import ProductImageService from '#services/product_image_service'
import ProductSearchService from '#services/product_search_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListProductsFilters = Partial<Omit<PaginateProductsData, 'searchIds'>>

export type ProductDetailsInput = {
  title: string
  description: string | null
  status: 'draft' | 'active'
  chargeTax?: boolean
  freeShipping?: boolean
  productTypeId?: string | null
  vendorId?: string | null
  productLabelId?: string | null
  tags?: string[]
  /** Drive keys from POST /admin/products/images. Omitted = unchanged. */
  coverImage?: string | null
  galleryImages?: string[]
  /** Omitted = unchanged; blank clears. */
  seoTitle?: string | null
  seoDescription?: string | null
}

export type ProductFacets = {
  productTypes: ProductType[]
  vendors: Vendor[]
  productLabels: ProductLabel[]
  tags: string[]
}

export type CatalogOptionSelection = {
  optionDefinitionId: string
  optionDefinitionValueIds: string[]
}

export type CreateProductInput = ProductDetailsInput & {
  price: number
  /** Original price shown struck through in the storefront when above `price`. */
  compareAtPrice?: number | null
  /** Applied to every variant created, in the store's weight unit. */
  weight?: number | null
  /** Prices in non-primary markets, applied to every variant created. */
  marketPrices?: VariantMarketPriceData[]
  options: CatalogOptionSelection[]
}

export type ProductDetail = {
  product: Product
  locations: Location[]
}

const normalize = (value: string) => value.trim().toLowerCase()

/**
 * Trims, lowercases and de-duplicates tag names, keeping first-seen order.
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalize).filter((tag) => tag.length > 0))]
}

function variantPairs(variant: ProductVariant): OptionPair[] {
  return variant.optionValues.map(({ option, value }) => ({ optionName: option.name, value }))
}

function combinationTitle(pairs: OptionPair[]): string {
  return pairs.length === 0 ? DEFAULT_VARIANT_TITLE : pairs.map(({ value }) => value).join(' / ')
}

/**
 * Moves an old combination onto the new options, in new option order.
 * Options that are new take their first value; options that were removed
 * are dropped. Returns null when the combination uses a removed value.
 */
function mapPairs(pairs: OptionPair[], options: OptionInput[]): OptionPair[] | null {
  const byOption = new Map(pairs.map((pair) => [normalize(pair.optionName), pair.value]))
  const mapped: OptionPair[] = []

  for (const option of options) {
    const previous = byOption.get(normalize(option.name))
    if (previous === undefined) {
      mapped.push({ optionName: option.name, value: option.values[0] })
      continue
    }
    const value = option.values.find((candidate) => normalize(candidate) === normalize(previous))
    if (value === undefined) return null
    mapped.push({ optionName: option.name, value })
  }

  return mapped
}

@inject()
export default class ProductService {
  constructor(
    protected productRepository: ProductRepository,
    protected locationRepository: LocationRepository,
    protected optionDefinitionRepository: OptionDefinitionRepository,
    protected productTypeRepository: ProductTypeRepository,
    protected vendorRepository: VendorRepository,
    protected productLabelRepository: ProductLabelRepository,
    protected auditLogService: AuditLogService,
    protected productSearchService: ProductSearchService,
    protected productImageService: ProductImageService,
    protected priceService: PriceService
  ) {}

  catalogOptionsToInput(resolved: ResolvedCatalogOption[]): OptionInput[] {
    return resolved.map(({ name, values }) => ({
      name,
      values: values.map(({ value }) => value),
    }))
  }

  async resolveCatalogOptions(
    selections: CatalogOptionSelection[]
  ): Promise<ResolvedCatalogOption[]> {
    const resolved = await this.optionDefinitionRepository.loadCatalogInputs(selections)
    if (resolved.some((row) => row === null)) {
      throw new Error('Invalid catalog option selection')
    }
    return resolved as ResolvedCatalogOption[]
  }

  /**
   * Back-office product list. A search runs the same Typesense query as the
   * storefront (title, tags, description) and also matches variant SKUs.
   */
  async paginate(filters: ListProductsFilters = {}) {
    const q = filters.q?.trim() || undefined
    const searchIds = q ? await this.productSearchService.matchingIds(q, filters.status) : null
    return this.productRepository.paginate({
      q,
      searchIds,
      status: filters.status,
      sort: filters.sort ?? 'updatedAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<Product> {
    return this.productRepository.findOrFail(id)
  }

  /**
   * The slugs from `slugs` already taken by a product.
   */
  async existingSlugs(slugs: string[]): Promise<Set<string>> {
    return new Set(await this.productRepository.slugsIn(slugs))
  }

  /**
   * The product with options, variants and stock, plus the active locations
   * stock can be assigned to.
   */
  async findDetail(id: string): Promise<ProductDetail> {
    const product = await this.productRepository.findWithDetailOrFail(id)
    const locations = await this.locationRepository.allActive()
    return { product, locations }
  }

  /**
   * Creates the product with one variant per option combination (or a single
   * default variant when there are no options), all at the given price.
   */
  async create({
    title,
    description,
    status,
    chargeTax,
    freeShipping,
    productTypeId,
    vendorId,
    productLabelId,
    tags,
    coverImage,
    galleryImages,
    seoTitle,
    seoDescription,
    price,
    compareAtPrice,
    weight,
    marketPrices,
    options: selections,
  }: CreateProductInput) {
    await this.productImageService.assertUploaded({ coverImage, galleryImages })
    const catalog = await this.resolveCatalogOptions(selections)
    const options = this.catalogOptionsToInput(catalog)
    const variants: NewVariantData[] = buildCombinations(options).map((combination, index) => ({
      title: combination.title,
      position: index,
      price,
      compareAtPrice: compareAtPrice ?? null,
      weight: weight ?? null,
      pairs: combination.pairs,
    }))

    const product = await this.productRepository.createWithVariants(
      {
        title,
        description: sanitizeEditorHtml(description),
        status,
        chargeTax: chargeTax ?? true,
        freeShipping: freeShipping ?? false,
        productTypeId: productTypeId ?? null,
        vendorId: vendorId ?? null,
        productLabelId: productLabelId ?? null,
        coverImage: coverImage ?? null,
        seoTitle: blankToNull(seoTitle),
        seoDescription: blankToNull(seoDescription),
        slug: await this.uniqueSlug(title),
      },
      catalog,
      variants,
      normalizeTags(tags ?? []),
      galleryImages ?? []
    )
    if (marketPrices && marketPrices.length > 0) {
      const variantIds = await this.productRepository.variantIdsFor(product.id)
      await this.priceService.syncVariantMarketPrices(variantIds, marketPrices)
    }
    await this.auditLogService.recordBulkCreate(Product, [product], {})
    await this.productSearchService.sync([product.id])
    return product
  }

  async variantIdsFor(productId: string): Promise<string[]> {
    return this.productRepository.variantIdsFor(productId)
  }

  /**
   * Photos no longer used after the update are deleted from Drive once the
   * product is saved.
   */
  async update(
    product: Product,
    {
      title,
      description,
      status,
      chargeTax,
      freeShipping,
      productTypeId,
      vendorId,
      productLabelId,
      tags,
      coverImage,
      galleryImages,
      seoTitle,
      seoDescription,
    }: ProductDetailsInput
  ) {
    await this.productImageService.assertUploaded({ coverImage, galleryImages })

    const slug = title === product.title ? product.slug : await this.uniqueSlug(title, product.id)
    const data: ProductData = {
      title,
      description: sanitizeEditorHtml(description),
      status,
      slug,
    }
    if (chargeTax !== undefined) data.chargeTax = chargeTax
    if (freeShipping !== undefined) data.freeShipping = freeShipping
    if (productTypeId !== undefined) data.productTypeId = productTypeId
    if (vendorId !== undefined) data.vendorId = vendorId
    if (productLabelId !== undefined) data.productLabelId = productLabelId
    if (coverImage !== undefined) data.coverImage = coverImage
    if (seoTitle !== undefined) data.seoTitle = blankToNull(seoTitle)
    if (seoDescription !== undefined) data.seoDescription = blankToNull(seoDescription)

    const imagesChanged = coverImage !== undefined || galleryImages !== undefined
    const previousCover = product.coverImage
    const previousGallery = imagesChanged
      ? await this.productRepository.galleryPaths(product.id)
      : []

    const updated = await this.productRepository.update(
      product,
      data,
      tags === undefined ? undefined : normalizeTags(tags),
      galleryImages
    )

    if (imagesChanged) {
      const kept = new Set([updated.coverImage, ...(galleryImages ?? previousGallery)])
      const candidates = [
        ...(coverImage === undefined ? [] : [previousCover]),
        ...(galleryImages === undefined ? [] : previousGallery),
      ]
      const removed = candidates.filter((key): key is string => key !== null && !kept.has(key))
      if (removed.length > 0) await this.productImageService.remove(removed)
    }

    await this.productSearchService.sync([updated.id])
    return updated
  }

  /**
   * Active product types, vendors and labels for the product form dropdowns,
   * plus tag names in use for autocomplete.
   */
  async facets(): Promise<ProductFacets> {
    const [productTypes, vendors, productLabels, tags] = await Promise.all([
      this.productTypeRepository.allActive(),
      this.vendorRepository.allActive(),
      this.productLabelRepository.allActive(),
      this.productRepository.tagNames(),
    ])
    return { productTypes, vendors, productLabels, tags }
  }

  /**
   * Applies new options as a diff against the current ones:
   * - each variant moves onto the new options (an added option gives it
   *   that option's first value; a removed option is dropped);
   * - variants that use a removed value are deleted, and variants that
   *   collapse onto the same combination keep only the first;
   * - only combinations that were impossible before (they use a new value)
   *   are created, at the first variant's price.
   * Combinations that were possible before but have no variant were deleted
   * by hand and stay deleted. If nothing would remain, the full matrix is
   * created so the product keeps at least one variant.
   */
  async syncOptions(product: Product, selections: CatalogOptionSelection[]): Promise<void> {
    const catalog = await this.resolveCatalogOptions(selections)
    const options = this.catalogOptionsToInput(catalog)
    const current = await this.productRepository.findWithDetailOrFail(product.id)
    const existing = current.variants
    const fallbackPrice = existing[0]?.price ?? 0
    const combinations = buildCombinations(options)
    const positions = new Map(combinations.map(({ key }, index) => [key, index]))

    const keep: KeptVariantData[] = []
    const keptKeys = new Set<string>()
    for (const variant of existing) {
      const pairs = mapPairs(variantPairs(variant), options)
      if (pairs === null) continue
      const key = combinationKey(pairs)
      if (keptKeys.has(key)) continue

      keptKeys.add(key)
      keep.push({
        id: variant.id,
        title: combinationTitle(pairs),
        position: positions.get(key) ?? 0,
        pairs,
      })
    }

    const previousOptions: OptionInput[] = current.options.map((option) => ({
      name: option.name,
      values: option.values.map(({ value }) => value),
    }))
    const reachable = new Set(
      buildCombinations(previousOptions)
        .map(({ pairs }) => mapPairs(pairs, options))
        .filter((pairs): pairs is OptionPair[] => pairs !== null)
        .map(combinationKey)
    )

    const toCreate =
      keep.length === 0 ? combinations : combinations.filter(({ key }) => !reachable.has(key))
    const create: NewVariantData[] = toCreate
      .filter(({ key }) => !keptKeys.has(key))
      .map(({ key, title, pairs }) => ({
        title,
        position: positions.get(key) ?? 0,
        price: fallbackPrice,
        pairs,
      }))

    const keptIds = new Set(keep.map(({ id }) => id))
    const deleteIds = existing.filter(({ id }) => !keptIds.has(id)).map(({ id }) => id)

    await this.productRepository.syncOptionsAndVariants(current, {
      options: catalog,
      keep,
      create,
      deleteIds,
    })
  }

  async archive(product: Product): Promise<Product> {
    const archived = await this.productRepository.setStatus(product, 'archived', DateTime.now())
    await this.productSearchService.sync([archived.id])
    return archived
  }

  /**
   * Unarchived products return as active.
   */
  async unarchive(product: Product): Promise<Product> {
    const restored = await this.productRepository.setStatus(product, 'active', null)
    await this.productSearchService.sync([restored.id])
    return restored
  }

  /**
   * Publishes (`active`) or unpublishes (`draft`) many products, restoring
   * archived ones to that status. Ones already at `status` are skipped.
   */
  async bulkSetStatus(ids: string[], status: 'draft' | 'active'): Promise<BulkResult> {
    return this.setStatusMany(ids, 'any', status, null)
  }

  /**
   * Archives (or, with `archived = false`, unarchives to active) many
   * products. Ones already in the requested state are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    return archived
      ? this.setStatusMany(ids, 'unarchived', 'archived', DateTime.now())
      : this.setStatusMany(ids, 'archived', 'active', null)
  }

  protected async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: ProductStatus,
    archivedAt: DateTime | null
  ): Promise<BulkResult> {
    const changed = await this.productRepository.setStatusMany(ids, from, status, archivedAt)
    await this.auditLogService.recordBulkUpdate(Product, changed, { status, archivedAt })
    await this.productSearchService.sync(changed.map(({ id }) => id))
    return bulkResult(ids, changed)
  }

  protected async uniqueSlug(title: string, ignoreId?: string): Promise<string> {
    const base = string.slug(title, { lower: true, strict: true }) || 'product'
    let slug = base
    let suffix = 2

    for (;;) {
      const existing = await this.productRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) {
        return slug
      }
      slug = `${base}-${suffix++}`
    }
  }
}
