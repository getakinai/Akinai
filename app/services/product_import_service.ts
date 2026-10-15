import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import type { Infer } from '@vinejs/vine/types'
import { MAX_IMPORT_ERRORS } from '#constants/csv_transfer'
import {
  IMAGE_URL_SEPARATOR,
  IMPORT_IMAGE_CONCURRENCY,
  MAX_IMPORT_IMAGE_URLS,
  PRODUCT_IMPORT_COLUMNS,
  PRODUCT_IMPORT_SAMPLE_ROWS,
  type ProductImportColumn,
} from '#constants/product_import'
import { MAX_GALLERY_IMAGES } from '#constants/upload_limits'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type OptionDefinition from '#models/option_definition'
import type Product from '#models/product'
import type ProductOption from '#models/product_option'
import type ProductVariant from '#models/product_variant'
import LocationRepository from '#repositories/location_repository'
import OptionDefinitionRepository, {
  type ResolvedCatalogOption,
} from '#repositories/option_definition_repository'
import ProductRepository, {
  type ImportProductChanges,
  type ImportProductData,
  type ImportProductUpdateData,
  type ImportVariantChanges,
  type ImportVariantData,
} from '#repositories/product_repository'
import ProductTypeRepository from '#repositories/product_type_repository'
import VendorRepository from '#repositories/vendor_repository'
import AuditLogService from '#services/audit_log_service'
import type { CsvExportActor, CsvImportResult } from '#services/base_csv_transfer_service'
import ProductImageService from '#services/product_image_service'
import { noProgress, type ProductImportProgress } from '#services/product_import_progress_service'
import { normalizeTags } from '#services/product_service'
import ProductSearchService from '#services/product_search_service'
import {
  combinationKey,
  DEFAULT_VARIANT_TITLE,
  type OptionPair,
} from '#services/variant_combinations'
import {
  csvFileError,
  csvRowErrors,
  parseCsvImport,
  presentCells,
  toCsv,
  type CsvImportError,
  type CsvImportRecord,
} from '#utils/csv'
import { RemoteImageError } from '#utils/remote_image'
import { sanitizeEditorHtml } from '#utils/sanitize_rich_text'
import { adminProductImportRowValidator } from '#validators/admin_product_import_row_validator'
import { MAX_PRODUCT_TAGS } from '#validators/helpers/product_merchandising_fields'
import { MAX_PRODUCT_OPTIONS, MAX_PRODUCT_VARIANTS } from '#validators/helpers/product_options'

type ImportRow = Infer<typeof adminProductImportRowValidator>

type Group = {
  handle: string
  rows: { line: number; row: ImportRow }[]
  errors: CsvImportError[]
}

type Lookups = {
  existing: Map<string, Product>
  /** Variant id by lowercased SKU, for SKUs in the file already in use. */
  skuOwners: Map<string, string>
  duplicateSkus: Set<string>
  vendors: Map<string, string>
  productTypes: Map<string, string>
  options: Map<string, OptionDefinition>
}

type OptionSlot = (typeof OPTION_SLOTS)[number]

/**
 * One option column of a product: the product's own option when updating,
 * and the catalog option its new values come from.
 */
type Slot = {
  slot: OptionSlot
  name: string
  productOption: ProductOption | null
  definition: OptionDefinition | null
}

type ResolvedValue = { value: string; optionDefinitionValueId: string | null; isNew: boolean }

type Built = ({ create: ImportProductData } | { update: ImportProductUpdateData }) & {
  group: Group
  /** Photos to copy in, the first one as the cover. Unset keeps the current photos. */
  imageUrls?: string[]
  /** Keys the product uses now, removed from storage once replaced. */
  previousImages: string[]
}

/** Runs `run` over `items`, at most `limit` at a time. Rethrows the first error after all finish. */
async function eachLimit<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
  let next = 0
  const failures: unknown[] = []
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++]
      try {
        await run(item)
      } catch (error) {
        failures.push(error)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  if (failures.length > 0) throw failures[0]
}

const OPTION_SLOTS = [1, 2, 3] as const
const MAX_TAG_LENGTH = 40

const LOWERCASE_COLUMNS = ['status', 'charge_tax', 'track_inventory'] as const

const lower = (value: string) => value.trim().toLowerCase()

const optionName = (row: ImportRow, slot: OptionSlot) => row[`option${slot}_name`]

const optionValue = (row: ImportRow, slot: OptionSlot) => row[`option${slot}_value`]

const MAX_LISTED_VALUES = 10

function listValues(values: string[], name: string): string {
  if (values.length === 0) return `${name} has no values yet.`
  const listed = values.slice(0, MAX_LISTED_VALUES).join(', ')
  return values.length > MAX_LISTED_VALUES
    ? `Use one of: ${listed} (and ${values.length - MAX_LISTED_VALUES} more).`
    : `Use one of: ${listed}.`
}

function allowedValues({ productOption, definition, name }: Slot): string {
  const values = [
    ...new Set([
      ...(productOption?.values ?? []).map(({ value }) => value),
      ...(definition?.values ?? []).map(({ value }) => value),
    ]),
  ]
  return listValues(values, name)
}

/**
 * Creates and updates products from a CSV with one row per variant,
 * grouped by `handle`. A handle that already exists updates that product:
 * empty cells keep the current value, rows are matched to its variants by
 * option values, and new combinations become new variants. Variants not in
 * the file are left as they are. Every name (vendor, product type, option,
 * option value) must already exist. `image_urls` are downloaded and
 * re-uploaded to our storage, replacing the product's photos. A product
 * with any error is skipped and reported; the valid ones are saved
 * together.
 */
@inject()
export default class ProductImportService {
  constructor(
    protected productRepository: ProductRepository,
    protected optionDefinitionRepository: OptionDefinitionRepository,
    protected vendorRepository: VendorRepository,
    protected productTypeRepository: ProductTypeRepository,
    protected locationRepository: LocationRepository,
    protected productSearchService: ProductSearchService,
    protected auditLogService: AuditLogService,
    protected productImageService: ProductImageService
  ) {}

  /**
   * The sample rows adapted to this store so they import as-is: handles and
   * SKUs get a suffix unique to this download (re-importing never clashes),
   * the first product uses the first active vendor and product type, and
   * the option rows use the first active option with two values. Without
   * such an option they collapse into a single default variant.
   */
  async sampleCsv(): Promise<string> {
    const [catalog, vendors, productTypes] = await Promise.all([
      this.optionDefinitionRepository.allActiveWithValues(),
      this.vendorRepository.allActive(),
      this.productTypeRepository.allActive(),
    ])
    const option = catalog.find((definition) => definition.values.length >= 2)
    const suffix = randomBytes(2).toString('hex')
    const firstHandle = PRODUCT_IMPORT_SAMPLE_ROWS[0].handle

    let valueIndex = 0
    const rows = PRODUCT_IMPORT_SAMPLE_ROWS.flatMap((sample) => {
      const row = {
        ...sample,
        handle: `${sample.handle}-${suffix}`,
        sku: sample.sku ? `${sample.sku}-${suffix.toUpperCase()}` : '',
      }
      if (sample.handle === firstHandle && sample.title) {
        row.vendor = vendors[0]?.name ?? ''
        row.product_type = productTypes[0]?.name ?? ''
      }
      if (!row.option1_value) return [row]
      if (!option) {
        return row.option1_name ? [{ ...row, option1_name: '', option1_value: '' }] : []
      }
      return [
        {
          ...row,
          option1_name: row.option1_name ? option.name : '',
          option1_value: option.values[valueIndex++ % option.values.length].value,
        },
      ]
    })

    return toCsv(PRODUCT_IMPORT_COLUMNS, rows)
  }

  async import(
    file: MultipartFile,
    actor: CsvExportActor,
    progress: ProductImportProgress = noProgress
  ): Promise<CsvImportResult> {
    if (!file.tmpPath) csvFileError('Upload the file again.')
    const records = parseCsvImport(await readFile(file.tmpPath), PRODUCT_IMPORT_COLUMNS, 'product')
    progress('reading', 0, records.length)
    const groups = await this.group(records)

    const lookups = await this.lookups(groups)
    const built: Built[] = []
    for (const group of groups) {
      const product = group.errors.length === 0 ? this.build(group, lookups) : null
      if (product) built.push(product)
    }

    const urlCount = built.reduce((sum, { imageUrls }) => sum + (imageUrls?.length ?? 0), 0)
    if (urlCount > MAX_IMPORT_IMAGE_URLS) {
      csvFileError(
        `The file has more than ${MAX_IMPORT_IMAGE_URLS} image URLs. Split it into smaller files.`
      )
    }

    progress('reading', records.length, records.length)

    const uploaded: string[] = []
    let ready: Built[]
    try {
      ready = await this.copyImages(built, uploaded, urlCount, progress)
    } catch (error) {
      await this.productImageService.remove(uploaded)
      throw error
    }

    progress('saving', 0, 1)

    const creates = ready.flatMap((entry) => ('create' in entry ? [entry.create] : []))
    const updates = ready.flatMap((entry) => ('update' in entry ? [entry.update] : []))
    const location = await this.locationRepository.findDefault()
    let created: Product[]
    try {
      created = await this.save(creates, updates, location?.isActive ? location.id : null)
    } catch (error) {
      await this.productImageService.remove(uploaded)
      throw error
    }

    await this.productSearchService.sync([
      ...created.map(({ id }) => id),
      ...updates.map(({ id }) => id),
    ])

    const allErrors = groups.flatMap((group) => group.errors)
    const result: CsvImportResult = {
      created: created.length,
      updated: updates.length,
      skipped: groups.length - created.length - updates.length,
      errors: allErrors.slice(0, MAX_IMPORT_ERRORS),
      errorCount: allErrors.length,
    }

    await this.auditLogService.recordSecurityEvent('products_imported', actor.user, {
      ipAddress: actor.ipAddress,
      details: { created: result.created, updated: result.updated, skipped: result.skipped },
    })

    return result
  }

  /**
   * Validates each row and groups rows by handle, in file order.
   */
  protected async group(records: CsvImportRecord<ProductImportColumn>[]): Promise<Group[]> {
    const groups = new Map<string, Group>()

    for (const { line, cells } of records) {
      const present = presentCells(cells, LOWERCASE_COLUMNS)
      const handleKey = lower(cells.handle) || `__row_${line}`
      const group = groups.get(handleKey) ?? { handle: handleKey, rows: [], errors: [] }
      groups.set(handleKey, group)

      try {
        const row = await adminProductImportRowValidator.validate(present)
        group.rows.push({ line, row })
      } catch (error) {
        group.errors.push(...csvRowErrors(line, error))
      }
    }

    return [...groups.values()]
  }

  /**
   * Existing products, SKUs and catalog names used by the file, one query
   * per kind.
   */
  protected async lookups(groups: Group[]): Promise<Lookups> {
    const rows = groups.flatMap((group) => group.rows.map(({ row }) => row))
    const firstRows = groups.flatMap((group) => (group.rows[0] ? [group.rows[0].row] : []))

    const skus = rows.flatMap(({ sku }) => (sku ? [lower(sku)] : []))
    const seen = new Set<string>()
    const duplicateSkus = new Set<string>()
    for (const sku of skus) {
      if (seen.has(sku)) duplicateSkus.add(sku)
      seen.add(sku)
    }

    const names = (pick: (row: ImportRow) => (string | undefined)[]) => [
      ...new Set(firstRows.flatMap((row) => pick(row).filter((name): name is string => !!name))),
    ]

    const [existing, skuOwners, vendors, productTypes, options] = await Promise.all([
      this.productRepository.findManyForImport(groups.map(({ handle }) => handle)),
      this.productRepository.variantIdsBySku([...seen]),
      this.vendorRepository.activeByNames(names((row) => [row.vendor])),
      this.productTypeRepository.activeByNames(names((row) => [row.product_type])),
      this.optionDefinitionRepository.activeByNamesWithValues(
        names((row) => OPTION_SLOTS.map((slot) => optionName(row, slot)))
      ),
    ])

    return {
      existing: new Map(existing.map((product) => [product.slug, product])),
      skuOwners,
      duplicateSkus,
      vendors: new Map(vendors.map((vendor) => [lower(vendor.name), vendor.id])),
      productTypes: new Map(productTypes.map((type) => [lower(type.name), type.id])),
      options: new Map(options.map((option) => [lower(option.name), option])),
    }
  }

  /**
   * The product to create or the changes to an existing one, or null after
   * recording the reasons it can't be saved on the group.
   */
  protected build(group: Group, lookups: Lookups): Built | null {
    const report = (line: number, field: string | null, message: string) => {
      group.errors.push({ row: line, field, message })
    }
    const { line: firstLine, row: first } = group.rows[0]
    const existing = lookups.existing.get(group.handle) ?? null

    if (!existing && !first.title) {
      report(firstLine, 'title', 'The first row of a product needs a title.')
    }

    let vendorId: string | null = null
    if (first.vendor) {
      vendorId = lookups.vendors.get(lower(first.vendor)) ?? null
      if (!vendorId) report(firstLine, 'vendor', `No active vendor named "${first.vendor}".`)
    }
    let productTypeId: string | null = null
    if (first.product_type) {
      productTypeId = lookups.productTypes.get(lower(first.product_type)) ?? null
      if (!productTypeId) {
        report(firstLine, 'product_type', `No active product type named "${first.product_type}".`)
      }
    }

    const imageUrls =
      first.image_urls === undefined
        ? undefined
        : this.imageUrls(first.image_urls, (message) => report(firstLine, 'image_urls', message))

    const tags = first.tags === undefined ? undefined : normalizeTags(first.tags.split(','))
    if (tags && tags.length > MAX_PRODUCT_TAGS) {
      report(firstLine, 'tags', `A product can have at most ${MAX_PRODUCT_TAGS} tags.`)
    }
    if (tags?.some((tag) => tag.length > MAX_TAG_LENGTH)) {
      report(firstLine, 'tags', `Each tag can be at most ${MAX_TAG_LENGTH} characters.`)
    }

    const slots = existing
      ? this.productSlots(existing, first, lookups, (field, message) =>
          report(firstLine, field, message)
        )
      : this.catalogSlots(first, lookups, (field, message) => report(firstLine, field, message))

    const namedSlots = new Set(OPTION_SLOTS.filter((slot) => optionName(first, slot) !== undefined))
    const existingVariants = existing ? this.variantsByCombination(existing) : new Map()
    const existingCount = existing?.variants.length ?? 0
    const usedValues = new Map<string, ResolvedValue[]>()
    const combinations = new Set<string>()
    const changedVariants: ImportVariantChanges[] = []
    const newVariants: ImportVariantData[] = []

    for (const [index, { line, row }] of group.rows.entries()) {
      if (index > 0 && row.image_urls !== undefined) {
        report(line, 'image_urls', "Set image_urls on the product's first row.")
      }
      for (const slot of OPTION_SLOTS) {
        if (!namedSlots.has(slot) && optionValue(row, slot) !== undefined) {
          report(line, `option${slot}_value`, `Set option${slot}_name on the product's first row.`)
        }
      }

      const pairs: OptionPair[] = slots.flatMap((slot) => {
        const raw = optionValue(row, slot.slot)
        if (!raw) {
          report(line, `option${slot.slot}_value`, `Every row needs a ${slot.name} value.`)
          return []
        }
        const resolved = this.resolveValue(slot, raw)
        if (!resolved) {
          report(
            line,
            `option${slot.slot}_value`,
            `"${raw}" is not a value of ${slot.name}. ${allowedValues(slot)}`
          )
          return []
        }
        const used = usedValues.get(slot.name) ?? []
        if (!used.some((entry) => lower(entry.value) === lower(resolved.value))) {
          used.push(resolved)
        }
        usedValues.set(slot.name, used)
        return [{ optionName: slot.name, value: resolved.value }]
      })

      const key = combinationKey(pairs)
      if (pairs.length === slots.length && combinations.has(key)) {
        report(
          line,
          null,
          slots.length === 0
            ? 'A product without options can only have one row.'
            : 'This option combination is already used by another row.'
        )
      }
      combinations.add(key)

      const matched: ProductVariant | undefined = existingVariants.get(key)
      if (row.sku) {
        const sku = lower(row.sku)
        const owner = lookups.skuOwners.get(sku)
        if (owner && owner !== matched?.id) {
          report(line, 'sku', `The SKU "${row.sku}" is already used by another variant.`)
        } else if (lookups.duplicateSkus.has(sku)) {
          report(line, 'sku', `The SKU "${row.sku}" appears more than once in the file.`)
        }
      }

      if (matched) {
        changedVariants.push(this.variantChanges(matched, row))
        continue
      }
      const trackInventory = row.track_inventory ?? false
      newVariants.push({
        title:
          pairs.length === 0 ? DEFAULT_VARIANT_TITLE : pairs.map(({ value }) => value).join(' / '),
        position: existingCount + newVariants.length,
        price: row.price,
        pairs,
        sku: row.sku ?? null,
        barcode: row.barcode ?? null,
        compareAtPrice: row.compare_at_price ?? null,
        trackInventory,
        available: trackInventory ? (row.inventory_quantity ?? 0) : null,
      })
    }

    if (existingCount + newVariants.length > MAX_PRODUCT_VARIANTS) {
      report(firstLine, null, `A product can have at most ${MAX_PRODUCT_VARIANTS} variants.`)
    }
    if (group.errors.length > 0) return null

    if (existing) {
      return {
        group,
        imageUrls,
        previousImages: [
          ...(existing.coverImage ? [existing.coverImage] : []),
          ...existing.images.map(({ path }) => path),
        ],
        update: {
          id: existing.id,
          changes: this.productChanges(existing, first, vendorId, productTypeId),
          tags,
          newValues: slots.flatMap(({ name, productOption }) => {
            if (!productOption) return []
            const added = (usedValues.get(name) ?? []).filter(({ isNew }) => isNew)
            return added.map(({ value, optionDefinitionValueId }, index) => ({
              productOptionId: productOption.id,
              optionDefinitionValueId,
              value,
              position: productOption.values.length + index,
            }))
          }),
          variants: changedVariants,
          newVariants,
        },
      }
    }

    const options: ResolvedCatalogOption[] = slots.flatMap(({ name, definition }) =>
      definition
        ? [
            {
              optionDefinitionId: definition.id,
              name: definition.name,
              values: (usedValues.get(name) ?? []).map(({ value, optionDefinitionValueId }) => ({
                optionDefinitionValueId: optionDefinitionValueId!,
                value,
              })),
            },
          ]
        : []
    )

    return {
      group,
      imageUrls,
      previousImages: [],
      create: {
        data: {
          title: first.title!,
          slug: group.handle,
          description: sanitizeEditorHtml(first.description),
          status: first.status ?? 'draft',
          chargeTax: first.charge_tax ?? true,
          productTypeId,
          vendorId,
          coverImage: null,
          seoTitle: first.seo_title ?? null,
          seoDescription: first.seo_description ?? null,
        },
        options,
        variants: newVariants,
        tags: tags ?? [],
        galleryImages: [],
      },
    }
  }

  /**
   * The URLs in an `image_urls` cell, after checking each one can be
   * downloaded (nothing is fetched yet).
   */
  protected imageUrls(cell: string, report: (message: string) => void): string[] {
    const urls = cell.split(IMAGE_URL_SEPARATOR).filter((url) => url.length > 0)
    if (urls.length > MAX_GALLERY_IMAGES + 1) {
      report(`A product can have at most ${MAX_GALLERY_IMAGES + 1} images.`)
    }
    if (new Set(urls).size !== urls.length) report('Each image URL can only be listed once.')
    for (const [index, url] of urls.entries()) {
      const problem = this.productImageService.urlProblem(url)
      if (problem) report(`Image ${index + 1}: ${problem}`)
    }
    return urls
  }

  /**
   * Copies each product's image URLs into our storage, a few at a time,
   * and points the product at the stored keys. A product with an image
   * that can't be used is reported and left out; its copies are removed.
   * Keys of newly stored files are added to `uploaded`.
   */
  protected async copyImages(
    built: Built[],
    uploaded: string[],
    total: number,
    progress: ProductImportProgress
  ): Promise<Built[]> {
    const failed = new Set<Built>()
    let done = 0
    if (total > 0) progress('images', 0, total)

    await eachLimit(
      built.filter(({ imageUrls }) => imageUrls && imageUrls.length > 0),
      IMPORT_IMAGE_CONCURRENCY,
      async (entry) => {
        const keys: string[] = []
        const fresh: string[] = []
        const urls = entry.imageUrls!
        for (const [index, url] of urls.entries()) {
          try {
            const image = await this.productImageService.importFromUrl(url, entry.previousImages)
            keys.push(image.key)
            if (image.uploaded) {
              fresh.push(image.key)
              uploaded.push(image.key)
            }
            done++
            progress('images', done, total)
          } catch (error) {
            if (!(error instanceof RemoteImageError)) throw error
            done += urls.length - index
            progress('images', done, total)
            entry.group.errors.push({
              row: entry.group.rows[0].line,
              field: 'image_urls',
              message: `Image ${index + 1}: ${error.message}`,
            })
            failed.add(entry)
            await this.productImageService.remove(fresh)
            return
          }
        }

        const [cover, ...gallery] = keys
        if ('create' in entry) {
          entry.create.data.coverImage = cover
          entry.create.galleryImages = gallery
        } else {
          entry.update.changes.coverImage = cover
          entry.update.galleryImages = gallery
        }
      }
    )

    return built.filter((entry) => !failed.has(entry))
  }

  /**
   * Option columns of a new product, resolved against the catalog.
   */
  protected catalogSlots(
    first: ImportRow,
    lookups: Lookups,
    report: (field: string | null, message: string) => void
  ): Slot[] {
    const slots = OPTION_SLOTS.flatMap((slot) => {
      const name = optionName(first, slot)
      if (!name) return []
      const definition = lookups.options.get(lower(name))
      if (!definition) {
        report(`option${slot}_name`, `No active option named "${name}".`)
        return []
      }
      return [{ slot, name: definition.name, productOption: null, definition }]
    })

    const definitionIds = slots.map(({ definition }) => definition.id)
    if (new Set(definitionIds).size !== definitionIds.length) {
      report(null, 'Each option can only be used once per product.')
    }
    if (slots.length > MAX_PRODUCT_OPTIONS) {
      report(null, `A product can have at most ${MAX_PRODUCT_OPTIONS} options.`)
    }
    return slots
  }

  /**
   * Option columns of an existing product. The first row must name the
   * product's options in order; new values come from the catalog option of
   * the same name.
   */
  protected productSlots(
    product: Product,
    first: ImportRow,
    lookups: Lookups,
    report: (field: string | null, message: string) => void
  ): Slot[] {
    const named = OPTION_SLOTS.flatMap((slot) => {
      const name = optionName(first, slot)
      return name ? [{ slot, name }] : []
    })
    const matches =
      named.length === product.options.length &&
      named.every(({ name }, index) => lower(name) === lower(product.options[index].name))

    if (!matches) {
      report(
        'option1_name',
        product.options.length === 0
          ? 'This product has no options. Leave the option columns empty.'
          : `This product's options are ${product.options.map(({ name }) => name).join(', ')}. Name them in that order on the first row.`
      )
      return []
    }

    return named.map(({ slot }, index) => {
      const productOption = product.options[index]
      const definition = lookups.options.get(lower(productOption.name)) ?? null
      return {
        slot,
        name: productOption.name,
        productOption,
        definition:
          definition && definition.id === productOption.optionDefinitionId ? definition : null,
      }
    })
  }

  /**
   * The product's own value first, then a catalog value the product
   * doesn't have yet.
   */
  protected resolveValue(slot: Slot, raw: string): ResolvedValue | null {
    const own = slot.productOption?.values.find(({ value }) => lower(value) === lower(raw))
    if (own) {
      return {
        value: own.value,
        optionDefinitionValueId: own.optionDefinitionValueId,
        isNew: false,
      }
    }
    const catalog = slot.definition?.values.find(({ value }) => lower(value) === lower(raw))
    if (catalog) return { value: catalog.value, optionDefinitionValueId: catalog.id, isNew: true }
    return null
  }

  protected variantsByCombination(product: Product): Map<string, ProductVariant> {
    const optionNames = new Map(product.options.map(({ id, name }) => [id, name]))
    return new Map(
      product.variants.map((variant) => [
        combinationKey(
          variant.optionValues.map(({ productOptionId, value }) => ({
            optionName: optionNames.get(productOptionId) ?? '',
            value,
          }))
        ),
        variant,
      ])
    )
  }

  /** The product columns set in the file; empty cells keep the current value. */
  protected productChanges(
    product: Product,
    first: ImportRow,
    vendorId: string | null,
    productTypeId: string | null
  ): ImportProductChanges {
    const changes: ImportProductChanges = {}
    if (first.title) changes.title = first.title
    if (first.description !== undefined) {
      changes.description = sanitizeEditorHtml(first.description)
    }
    if (first.status) {
      changes.status = first.status
      if (product.status === 'archived') changes.archivedAt = null
    }
    if (first.charge_tax !== undefined) changes.chargeTax = first.charge_tax
    if (vendorId) changes.vendorId = vendorId
    if (productTypeId) changes.productTypeId = productTypeId
    if (first.seo_title !== undefined) changes.seoTitle = first.seo_title
    if (first.seo_description !== undefined) changes.seoDescription = first.seo_description
    return changes
  }

  /** The variant columns set in the row; empty cells keep the current value. */
  protected variantChanges(variant: ProductVariant, row: ImportRow): ImportVariantChanges {
    const changes: ImportVariantChanges = { id: variant.id, price: row.price }
    if (row.sku !== undefined) changes.sku = row.sku
    if (row.barcode !== undefined) changes.barcode = row.barcode
    if (row.compare_at_price !== undefined) changes.compareAtPrice = row.compare_at_price
    if (row.track_inventory !== undefined) changes.trackInventory = row.track_inventory
    const tracked = row.track_inventory ?? variant.trackInventory
    if (tracked && row.inventory_quantity !== undefined) changes.available = row.inventory_quantity
    return changes
  }

  /**
   * A handle or SKU taken by another request between the checks and the
   * insert trips a unique constraint; nothing from the file is saved then.
   */
  protected async save(
    creates: ImportProductData[],
    updates: ImportProductUpdateData[],
    locationId: string | null
  ) {
    try {
      return await this.productRepository.importMany(creates, updates, locationId)
    } catch (error) {
      if ((error as { code?: string }).code !== '23505') throw error
      throw new BusinessRuleException(
        'A handle or SKU in the file was taken while importing. Nothing was imported; try again.'
      )
    }
  }
}
