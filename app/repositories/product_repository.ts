import type { DateTime } from 'luxon'
import { v7 as uuidv7 } from 'uuid'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import InventoryLevel from '#models/inventory_level'
import Product, { type ProductStatus } from '#models/product'
import ProductImage from '#models/product_image'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import ProductTag from '#models/product_tag'
import ProductVariant from '#models/product_variant'
import ProductVariantOptionValue from '#models/product_variant_option_value'
import type { ResolvedCatalogOption } from '#repositories/option_definition_repository'
import type { OptionPair } from '#services/variant_combinations'
import { bulkUpdate, type BulkStatusSource } from '#repositories/helpers/bulk_update'
import { caseUpdate, type CaseUpdateRow } from '#repositories/helpers/case_update'
import { containsPattern } from '#repositories/helpers/like'
import { lowerIn } from '#repositories/helpers/lower_in'

export type ProductData = {
  title: string
  slug: string
  description: string | null
  status: ProductStatus
  chargeTax?: boolean
  freeShipping?: boolean
  productTypeId?: string | null
  vendorId?: string | null
  productLabelId?: string | null
  coverImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export type NewVariantData = {
  title: string
  position: number
  price: number
  pairs: OptionPair[]
  sku?: string | null
  barcode?: string | null
  compareAtPrice?: number | null
  weight?: number | null
  trackInventory?: boolean
}

export type ImportVariantData = NewVariantData & {
  /** Units at the import location; only written for tracked variants. */
  available: number | null
}

export type ImportProductData = {
  data: ProductData
  options: ResolvedCatalogOption[]
  variants: ImportVariantData[]
  tags: string[]
  galleryImages: string[]
}

/** Product columns an import can change; fields left out keep their value. */
export type ImportProductChanges = Partial<
  Pick<
    ProductData,
    | 'title'
    | 'description'
    | 'status'
    | 'chargeTax'
    | 'vendorId'
    | 'productTypeId'
    | 'seoTitle'
    | 'seoDescription'
    | 'coverImage'
  >
> & { archivedAt?: null }

/** An existing variant matched by its option values; fields left out keep their value. */
export type ImportVariantChanges = {
  id: string
  price: number
  sku?: string
  barcode?: string
  compareAtPrice?: number
  trackInventory?: boolean
  /** Units at the import location. */
  available?: number
}

export type ImportProductUpdateData = {
  id: string
  changes: ImportProductChanges
  /** Replaces the product's tags when set. */
  tags?: string[]
  /** Replaces the product's gallery photos (Drive keys) when set. */
  galleryImages?: string[]
  /** Option values the product doesn't have yet, used by `newVariants`. */
  newValues: {
    productOptionId: string
    optionDefinitionValueId: string | null
    value: string
    position: number
  }[]
  variants: ImportVariantChanges[]
  newVariants: ImportVariantData[]
}

export type KeptVariantData = {
  id: string
  title: string
  position: number
  pairs: OptionPair[]
}

export type SyncVariantsData = {
  options: ResolvedCatalogOption[]
  keep: KeptVariantData[]
  create: NewVariantData[]
  deleteIds: string[]
}

export type ProductSortKey = 'title' | 'status' | 'createdAt' | 'updatedAt'

export type PaginateProductsData = {
  q?: string
  searchIds?: string[] | null
  status?: ProductStatus
  sort: ProductSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

export type ProductListFilters = Pick<PaginateProductsData, 'q' | 'searchIds' | 'status'>

export type ExportProductsData = ProductListFilters &
  Pick<PaginateProductsData, 'sort' | 'direction'> & { limit: number }

const sortColumns: Record<ProductSortKey, string> = {
  title: 'title',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

const pairKey = (optionName: string, value: string) =>
  `${optionName.trim().toLowerCase()}:${value.trim().toLowerCase()}`

const IMPORT_PRODUCT_COLUMNS: Record<keyof ImportProductChanges, [string, string]> = {
  title: ['title', 'text'],
  description: ['description', 'text'],
  status: ['status', 'text'],
  chargeTax: ['charge_tax', 'boolean'],
  vendorId: ['vendor_id', 'uuid'],
  productTypeId: ['product_type_id', 'uuid'],
  seoTitle: ['seo_title', 'text'],
  seoDescription: ['seo_description', 'text'],
  coverImage: ['cover_image', 'text'],
  archivedAt: ['archived_at', 'timestamp'],
}

const IMPORT_VARIANT_COLUMNS = {
  price: ['price', 'numeric'],
  sku: ['sku', 'text'],
  barcode: ['barcode', 'text'],
  compareAtPrice: ['compare_at_price', 'numeric'],
  trackInventory: ['track_inventory', 'boolean'],
} as const satisfies Partial<Record<keyof ImportVariantChanges, [string, string]>>

const columnTypes = (columns: Record<string, readonly [string, string]>) =>
  Object.fromEntries(Object.values(columns))

/** The given `fields` as column name to value, for `caseUpdate`. */
function columnValues<Fields extends object>(
  fields: Fields,
  columns: Partial<Record<keyof Fields, readonly [string, string]>>
): CaseUpdateRow['values'] {
  const values: CaseUpdateRow['values'] = {}
  for (const [key, [column]] of Object.entries(columns) as [keyof Fields, [string, string]][]) {
    const value = fields[key]
    if (value !== undefined) values[column] = value as CaseUpdateRow['values'][string]
  }
  return values
}

const variantRow = (productId: string, variant: NewVariantData) => ({
  productId,
  title: variant.title,
  position: variant.position,
  price: variant.price,
  sku: variant.sku ?? null,
  barcode: variant.barcode ?? null,
  compareAtPrice: variant.compareAtPrice ?? null,
  weight: variant.weight ?? null,
  trackInventory: variant.trackInventory ?? false,
})

/**
 * Products with the `variants_count`, `available_total`, `price_min`,
 * `price_max` and `missing_price_currencies` (currencies of active
 * non-primary markets where some variant has no price) extras read by
 * ProductTransformer's list row.
 */
export function productListRowQuery() {
  return Product.query()
    .select('products.*')
    .select(
      db.raw(
        `(select coalesce(sum(il.available), 0)
          from inventory_levels il
          join product_variants pv on pv.id = il.product_variant_id
          where pv.product_id = products.id) as available_total`
      )
    )
    .select(
      db.raw(
        `(select coalesce(array_agg(distinct m.currency_code order by m.currency_code), '{}')
          from product_variants pv
          cross join markets m
          where pv.product_id = products.id
            and m.is_active = true
            and m.is_primary = false
            and not exists (
              select 1 from product_variant_prices vp
              where vp.product_variant_id = pv.id and vp.market_id = m.id
            )) as missing_price_currencies`
      )
    )
    .withCount('variants')
    .withAggregate('variants', (query) => query.min('price').as('price_min'))
    .withAggregate('variants', (query) => query.max('price').as('price_max'))
}

/**
 * The back-office list filter. With `searchIds` (search engine hits), `q`
 * matches those products or a variant SKU; without them it falls back to
 * a title match.
 */
function applyListFilters<Query extends ModelQueryBuilderContract<typeof Product, Product>>(
  query: Query,
  { q, searchIds, status }: ProductListFilters
): Query {
  return query
    .if(q, (scoped) =>
      scoped.where((group) =>
        (searchIds
          ? group.whereIn('products.id', searchIds)
          : group.whereILike('products.title', containsPattern(q!))
        ).orWhereExists((variants) =>
          variants
            .from('product_variants')
            .whereColumn('product_variants.product_id', 'products.id')
            .whereILike('product_variants.sku', containsPattern(q!))
        )
      )
    )
    .if(status, (scoped) => scoped.where('products.status', status!))
}

export default class ProductRepository {
  async paginate({ q, searchIds, status, sort, direction, page, perPage }: PaginateProductsData) {
    return applyListFilters(productListRowQuery(), { q, searchIds, status })
      .orderBy(`products.${sortColumns[sort]}`, direction)
      .orderBy('products.id', direction)
      .paginate(page, perPage)
  }

  /**
   * Products matching the list filter, in list order, with everything a
   * CSV export row needs. Variants carry `available_total` (stock summed
   * across locations) in `$extras`.
   */
  async exportRows({ q, searchIds, status, sort, direction, limit }: ExportProductsData) {
    return applyListFilters(Product.query(), { q, searchIds, status })
      .select(
        'products.id',
        'products.slug',
        'products.title',
        'products.description',
        'products.status',
        'products.charge_tax',
        'products.seo_title',
        'products.seo_description',
        'products.vendor_id',
        'products.product_type_id',
        'products.created_at',
        'products.updated_at'
      )
      .preload('vendor', (query) => query.select('id', 'name'))
      .preload('productType', (query) => query.select('id', 'name'))
      .preload('tags', (query) => query.select('product_id', 'name').orderBy('name', 'asc'))
      .preload('options', (query) =>
        query.select('id', 'product_id', 'name', 'position').orderBy('position', 'asc')
      )
      .preload('variants', (query) =>
        query
          .select(
            'id',
            'product_id',
            'sku',
            'barcode',
            'price',
            'compare_at_price',
            'track_inventory',
            'position'
          )
          .withAggregate('inventoryLevels', (levels) =>
            levels.sum('available').as('available_total')
          )
          .preload('optionValues', (values) =>
            values.select(
              'product_option_values.id',
              'product_option_values.product_option_id',
              'product_option_values.value'
            )
          )
          .orderBy('position', 'asc')
      )
      .orderBy(`products.${sortColumns[sort]}`, direction)
      .orderBy('products.id', direction)
      .limit(limit)
  }

  async findOrFail(id: string): Promise<Product> {
    return Product.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return Product.findBy('slug', slug)
  }

  async slugsIn(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) return []
    const rows = await Product.query().whereIn('slug', slugs).select('slug')
    return rows.map((row) => row.slug)
  }

  /**
   * Product with its options (and values) and variants (with option values
   * and inventory levels), all ordered by position.
   */
  async variantIdsFor(productId: string): Promise<string[]> {
    const variants = await ProductVariant.query().select('id').where('product_id', productId)
    return variants.map(({ id }) => id)
  }

  async findWithDetailOrFail(id: string): Promise<Product> {
    return Product.query()
      .where('id', id)
      .preload('productType')
      .preload('vendor')
      .preload('productLabel')
      .withCount('reviews')
      .preload('tags', (tags) => tags.orderBy('name', 'asc'))
      .preload('images', (images) => images.orderBy('position', 'asc'))
      .preload('options', (options) =>
        options.orderBy('position', 'asc').preload('values', (values) => values.orderBy('position'))
      )
      .preload('variants', (variants) =>
        variants
          .orderBy('position', 'asc')
          .preload('optionValues', (values) => values.preload('option'))
          .preload('inventoryLevels')
          .preload('marketPrices')
      )
      .firstOrFail()
  }

  async createWithVariants(
    data: ProductData,
    options: ResolvedCatalogOption[],
    variants: NewVariantData[],
    tags: string[] = [],
    galleryImages: string[] = []
  ): Promise<Product> {
    return db.transaction(async (trx) => {
      const product = await Product.create(data, { client: trx })
      const valueIds = await this.writeOptions(product.id, options, trx)
      await this.createVariants(product.id, variants, valueIds, trx)
      await this.writeTags(product.id, tags, trx)
      await this.writeImages(product.id, galleryImages, trx)
      return product
    })
  }

  /**
   * Products with these slugs, with their photos, options (and values) and
   * variants (and option values), for an import to update.
   */
  async findManyForImport(slugs: string[]): Promise<Product[]> {
    if (slugs.length === 0) return []
    return Product.query()
      .whereIn('slug', slugs)
      .select('id', 'slug', 'status', 'cover_image')
      .preload('images', (images) =>
        images.select('id', 'product_id', 'path').orderBy('position', 'asc')
      )
      .preload('options', (options) =>
        options.orderBy('position', 'asc').preload('values', (values) => values.orderBy('position'))
      )
      .preload('variants', (variants) =>
        variants
          .select('id', 'product_id', 'sku', 'position', 'track_inventory')
          .orderBy('position', 'asc')
          .preload('optionValues')
      )
  }

  /**
   * Variant ids by lowercased SKU, for SKUs from `skus` already in use.
   */
  async variantIdsBySku(skus: string[]): Promise<Map<string, string>> {
    if (skus.length === 0) return new Map()
    const rows = await ProductVariant.query()
      .whereRaw(...lowerIn('sku', skus))
      .select('id', 'sku')
    return new Map(rows.map((row) => [row.sku!.toLowerCase(), row.id]))
  }

  /**
   * Creates the new products and applies the updates to existing ones in
   * one transaction, one statement per table. Stock is set at `locationId`.
   * Returns the created products in input order.
   */
  async importMany(
    products: ImportProductData[],
    updates: ImportProductUpdateData[],
    locationId: string | null
  ): Promise<Product[]> {
    if (products.length === 0 && updates.length === 0) return []

    return db.transaction(async (trx) => {
      const created = await this.insertImported(products, locationId, trx)
      await this.updateImported(updates, locationId, trx)
      return created
    })
  }

  protected async insertImported(
    products: ImportProductData[],
    locationId: string | null,
    trx: TransactionClientContract
  ): Promise<Product[]> {
    if (products.length === 0) return []

    const created = await Product.createMany(
      products.map(({ data }) => data),
      { client: trx }
    )

    const optionSources = created.flatMap((product, index) =>
      products[index].options.map((option, position) => ({
        productId: product.id,
        option,
        position,
      }))
    )
    const options =
      optionSources.length > 0
        ? await ProductOption.createMany(
            optionSources.map(({ productId, option, position }) => ({
              productId,
              optionDefinitionId: option.optionDefinitionId,
              name: option.name,
              position,
            })),
            { client: trx }
          )
        : []

    const valueSources = optionSources.flatMap(({ productId, option }, index) =>
      option.values.map((entry, position) => ({
        productId,
        optionName: option.name,
        row: {
          productOptionId: options[index].id,
          optionDefinitionValueId: entry.optionDefinitionValueId,
          value: entry.value,
          position,
        },
      }))
    )
    const values =
      valueSources.length > 0
        ? await ProductOptionValue.createMany(
            valueSources.map(({ row }) => row),
            { client: trx }
          )
        : []
    const valueIds = new Map<string, string>()
    for (const [index, { productId, optionName, row }] of valueSources.entries()) {
      valueIds.set(`${productId}|${pairKey(optionName, row.value)}`, values[index].id)
    }

    const variantSources = created.flatMap((product, index) =>
      products[index].variants.map((variant) => ({ productId: product.id, variant }))
    )
    const variants = await ProductVariant.createMany(
      variantSources.map(({ productId, variant }) => variantRow(productId, variant)),
      { client: trx }
    )

    const links = variantSources.flatMap(({ productId, variant }, index) =>
      variant.pairs.map(({ optionName, value }) => ({
        productVariantId: variants[index].id,
        productOptionValueId: valueIds.get(`${productId}|${pairKey(optionName, value)}`)!,
      }))
    )
    if (links.length > 0) {
      await ProductVariantOptionValue.createMany(links, { client: trx })
    }

    const tags = created.flatMap((product, index) =>
      products[index].tags.map((name) => ({ productId: product.id, name }))
    )
    if (tags.length > 0) {
      await ProductTag.createMany(tags, { client: trx })
    }

    const images = created.flatMap((product, index) =>
      products[index].galleryImages.map((path, position) => ({
        productId: product.id,
        path,
        position,
      }))
    )
    if (images.length > 0) {
      await ProductImage.createMany(images, { client: trx })
    }

    const levels = locationId
      ? variantSources.flatMap(({ variant }, index) =>
          variant.trackInventory && variant.available !== null
            ? [{ productVariantId: variants[index].id, locationId, available: variant.available }]
            : []
        )
      : []
    if (levels.length > 0) {
      await InventoryLevel.createMany(levels, { client: trx })
    }

    return created
  }

  /**
   * Sets the changed product and variant columns with one `UPDATE ... CASE`
   * per table, replaces tags where given, adds the new option values and
   * variants, and upserts stock at `locationId`.
   */
  protected async updateImported(
    updates: ImportProductUpdateData[],
    locationId: string | null,
    trx: TransactionClientContract
  ): Promise<void> {
    if (updates.length === 0) return

    await caseUpdate(
      trx,
      'products',
      columnTypes(IMPORT_PRODUCT_COLUMNS),
      updates.map(({ id, changes }) => ({
        id,
        values: columnValues(changes, IMPORT_PRODUCT_COLUMNS),
      }))
    )

    const retagged = updates.filter(({ tags }) => tags !== undefined)
    if (retagged.length > 0) {
      await ProductTag.query({ client: trx })
        .whereIn(
          'product_id',
          retagged.map(({ id }) => id)
        )
        .delete()
      const tagRows = retagged.flatMap(({ id, tags }) =>
        (tags ?? []).map((name) => ({ productId: id, name }))
      )
      if (tagRows.length > 0) await ProductTag.createMany(tagRows, { client: trx })
    }

    const regallery = updates.filter(({ galleryImages }) => galleryImages !== undefined)
    if (regallery.length > 0) {
      await ProductImage.query({ client: trx })
        .whereIn(
          'product_id',
          regallery.map(({ id }) => id)
        )
        .delete()
      const imageRows = regallery.flatMap(({ id, galleryImages }) =>
        (galleryImages ?? []).map((path, position) => ({ productId: id, path, position }))
      )
      if (imageRows.length > 0) await ProductImage.createMany(imageRows, { client: trx })
    }

    const newValues = updates.flatMap(({ newValues: values }) => values)
    if (newValues.length > 0) await ProductOptionValue.createMany(newValues, { client: trx })

    const changedVariants = updates.flatMap(({ variants }) => variants)
    await caseUpdate(
      trx,
      'product_variants',
      columnTypes(IMPORT_VARIANT_COLUMNS),
      changedVariants.map((variant) => ({
        id: variant.id,
        values: columnValues(variant, IMPORT_VARIANT_COLUMNS),
      }))
    )

    const sources = updates.flatMap(({ id, newVariants }) =>
      newVariants.map((variant) => ({ productId: id, variant }))
    )
    const createdVariants =
      sources.length > 0
        ? await ProductVariant.createMany(
            sources.map(({ productId, variant }) => variantRow(productId, variant)),
            { client: trx }
          )
        : []
    if (sources.length > 0) {
      const valueIds = await this.optionValueIdsFor(
        [...new Set(sources.map(({ productId }) => productId))],
        trx
      )
      const links = sources.flatMap(({ productId, variant }, index) =>
        variant.pairs.map(({ optionName, value }) => ({
          productVariantId: createdVariants[index].id,
          productOptionValueId: valueIds.get(`${productId}|${pairKey(optionName, value)}`)!,
        }))
      )
      if (links.length > 0) await ProductVariantOptionValue.createMany(links, { client: trx })
    }

    if (!locationId) return
    const levels = [
      ...changedVariants.flatMap(({ id, available }) =>
        available === undefined ? [] : [{ variantId: id, available }]
      ),
      ...sources.flatMap(({ variant }, index) =>
        variant.trackInventory && variant.available !== null
          ? [{ variantId: createdVariants[index].id, available: variant.available }]
          : []
      ),
    ]
    if (levels.length === 0) return

    const now = new Date()
    await trx
      .knexQuery()
      .table('inventory_levels')
      .insert(
        levels.map(({ variantId, available }) => ({
          id: uuidv7(),
          product_variant_id: variantId,
          location_id: locationId,
          available,
          created_at: now,
          updated_at: now,
        }))
      )
      .onConflict(['product_variant_id', 'location_id'])
      .merge(['available', 'updated_at'])
  }

  /** Option value ids of `productIds`, keyed `productId|name:value` (lowercased). */
  protected async optionValueIdsFor(
    productIds: string[],
    trx: TransactionClientContract
  ): Promise<Map<string, string>> {
    const rows: { id: string; value: string; name: string; product_id: string }[] = await trx
      .from('product_option_values as pov')
      .join('product_options as po', 'po.id', 'pov.product_option_id')
      .whereIn('po.product_id', productIds)
      .select('pov.id', 'pov.value', 'po.name', 'po.product_id')
    return new Map(rows.map((row) => [`${row.product_id}|${pairKey(row.name, row.value)}`, row.id]))
  }

  /**
   * Updates the product and, when `tags` or `galleryImages` are given,
   * replaces them in the same transaction.
   */
  async update(
    product: Product,
    data: ProductData,
    tags?: string[],
    galleryImages?: string[]
  ): Promise<Product> {
    return db.transaction(async (trx) => {
      product.useTransaction(trx)
      await product.merge(data).save()
      if (tags !== undefined) {
        await ProductTag.query({ client: trx }).where('product_id', product.id).delete()
        await this.writeTags(product.id, tags, trx)
      }
      if (galleryImages !== undefined) {
        await ProductImage.query({ client: trx }).where('product_id', product.id).delete()
        await this.writeImages(product.id, galleryImages, trx)
      }
      return product
    })
  }

  /**
   * Drive keys of the product's gallery photos, in position order.
   */
  async galleryPaths(productId: string): Promise<string[]> {
    const rows = await ProductImage.query()
      .where('product_id', productId)
      .orderBy('position', 'asc')
      .select('path')
    return rows.map((row) => row.path)
  }

  /**
   * Products in `ids` with their tags, the shape the search index needs.
   */
  async findManyForSearchIndex(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return []
    return Product.query().whereIn('id', ids).preload('tags')
  }

  /**
   * One page of every product with tags, ordered by id, for full reindexes.
   */
  async pageForSearchIndex(page: number, perPage: number) {
    return Product.query().preload('tags').orderBy('id', 'asc').paginate(page, perPage)
  }

  /**
   * Distinct tag names in use, for autocomplete.
   */
  async tagNames(): Promise<string[]> {
    const tags = await db.from('product_tags').distinct('name').orderBy('name', 'asc')
    return tags.map((row) => row.name as string)
  }

  protected async writeTags(
    productId: string,
    tags: string[],
    trx: TransactionClientContract
  ): Promise<void> {
    if (tags.length === 0) return
    await ProductTag.createMany(
      tags.map((name) => ({ productId, name })),
      { client: trx }
    )
  }

  protected async writeImages(
    productId: string,
    paths: string[],
    trx: TransactionClientContract
  ): Promise<void> {
    if (paths.length === 0) return
    await ProductImage.createMany(
      paths.map((path, position) => ({ productId, path, position })),
      { client: trx }
    )
  }

  async setStatus(
    product: Product,
    status: ProductStatus,
    archivedAt: DateTime | null
  ): Promise<Product> {
    return product.merge({ status, archivedAt }).save()
  }

  /**
   * Sets the status of the products in `ids` allowed by `from`, skipping
   * ones already at `status`. Returns the changed rows as they were.
   */
  async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: ProductStatus,
    archivedAt: DateTime | null
  ): Promise<Product[]> {
    return bulkUpdate(Product, ids, { status, archivedAt }, (query) =>
      query
        .if(from === 'archived', (scoped) => scoped.where('status', 'archived'))
        .if(from === 'unarchived', (scoped) => scoped.whereNot('status', 'archived'))
        .whereNot('status', status)
    )
  }

  /**
   * Replaces the product's options and applies the variant plan in one
   * transaction. Deleting the old options cascades the old pivot rows, so
   * kept variants are re-linked to the new option values.
   */
  async syncOptionsAndVariants(product: Product, plan: SyncVariantsData): Promise<void> {
    await db.transaction(async (trx) => {
      await ProductOption.query({ client: trx }).where('product_id', product.id).delete()
      const valueIds = await this.writeOptions(product.id, plan.options, trx)

      if (plan.deleteIds.length > 0) {
        await ProductVariant.query({ client: trx })
          .where('product_id', product.id)
          .whereIn('id', plan.deleteIds)
          .delete()
      }

      for (const variant of plan.keep) {
        await ProductVariant.query({ client: trx })
          .where('id', variant.id)
          .update({ title: variant.title, position: variant.position, updated_at: new Date() })
      }
      await this.linkPairs(
        plan.keep.map(({ id, pairs }) => ({ variantId: id, pairs })),
        valueIds,
        trx
      )

      await this.createVariants(product.id, plan.create, valueIds, trx)
    })
  }

  /**
   * Inserts options and their values. Returns a map from `name:value`
   * (lowercased) to the option value id.
   */
  protected async writeOptions(
    productId: string,
    options: ResolvedCatalogOption[],
    trx: TransactionClientContract
  ): Promise<Map<string, string>> {
    const valueIds = new Map<string, string>()

    for (const [position, input] of options.entries()) {
      const option = await ProductOption.create(
        {
          productId,
          optionDefinitionId: input.optionDefinitionId,
          name: input.name,
          position,
        },
        { client: trx }
      )
      const values = await ProductOptionValue.createMany(
        input.values.map((entry, index) => ({
          productOptionId: option.id,
          optionDefinitionValueId: entry.optionDefinitionValueId,
          value: entry.value,
          position: index,
        })),
        { client: trx }
      )
      for (const value of values) {
        valueIds.set(pairKey(input.name, value.value), value.id)
      }
    }

    return valueIds
  }

  protected async createVariants(
    productId: string,
    variants: NewVariantData[],
    valueIds: Map<string, string>,
    trx: TransactionClientContract
  ): Promise<void> {
    if (variants.length === 0) return

    const created = await ProductVariant.createMany(
      variants.map((variant) => variantRow(productId, variant)),
      { client: trx }
    )

    await this.linkPairs(
      created.map((variant, index) => ({ variantId: variant.id, pairs: variants[index].pairs })),
      valueIds,
      trx
    )
  }

  protected async linkPairs(
    rows: { variantId: string; pairs: OptionPair[] }[],
    valueIds: Map<string, string>,
    trx: TransactionClientContract
  ): Promise<void> {
    const links = rows.flatMap(({ variantId, pairs }) =>
      pairs.map(({ optionName, value }) => ({
        productVariantId: variantId,
        productOptionValueId: valueIds.get(pairKey(optionName, value))!,
      }))
    )
    if (links.length > 0) {
      await ProductVariantOptionValue.createMany(links, { client: trx })
    }
  }
}
