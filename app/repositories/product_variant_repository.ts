import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'
import ProductVariantOptionValue from '#models/product_variant_option_value'
import { containsPattern } from '#repositories/helpers/like'

export type VariantFieldsData = {
  sku: string | null
  barcode: string | null
  price: number
  compareAtPrice: number | null
  /** Omitted on update = unchanged. */
  weight?: number | null
  trackInventory: boolean
}

/** A catalog value to add to one of the product's options for this variant. */
export type NewOptionValueData = {
  productOptionId: string
  optionDefinitionValueId: string
  value: string
  position: number
}

export type NewProductVariantData = VariantFieldsData & {
  title: string
  optionValueIds: string[]
  newOptionValues?: NewOptionValueData[]
}

export type UpdateVariantData = VariantFieldsData & {
  title?: string
  optionValueIds?: string[]
  newOptionValues?: NewOptionValueData[]
}

export default class ProductVariantRepository {
  /**
   * The variant, scoped to its product, with the product (and its variant
   * ids, for the last-variant rule), option values and stock preloaded.
   * Throws when the variant belongs to a different product.
   */
  async findForProductOrFail(productId: string, id: string): Promise<ProductVariant> {
    return ProductVariant.query()
      .where('id', id)
      .where('product_id', productId)
      .preload('product', (product) =>
        product.preload('variants', (variants) => variants.select('id', 'product_id'))
      )
      .preload('optionValues', (values) => values.preload('option'))
      .preload('inventoryLevels')
      .preload('marketPrices')
      .firstOrFail()
  }

  /**
   * Adds the variant after the product's last one and links its option
   * values, adding `newOptionValues` to the product's options first.
   */
  async create(productId: string, data: NewProductVariantData): Promise<ProductVariant> {
    const { optionValueIds: existingIds, newOptionValues = [], ...fields } = data

    return db.transaction(async (trx) => {
      const optionValueIds = [
        ...existingIds,
        ...(await this.createOptionValues(newOptionValues, trx)),
      ]

      const last = await ProductVariant.query({ client: trx })
        .where('product_id', productId)
        .orderBy('position', 'desc')
        .first()

      const variant = await ProductVariant.create(
        { ...fields, productId, position: last ? last.position + 1 : 0 },
        { client: trx }
      )
      await this.linkOptionValues(variant.id, optionValueIds, trx)
      return variant
    })
  }

  /**
   * Saves the fields and, when `optionValueIds` is given, replaces the
   * variant's option values in the same transaction.
   */
  async update(variant: ProductVariant, data: UpdateVariantData): Promise<ProductVariant> {
    const { optionValueIds, newOptionValues = [], ...fields } = data

    return db.transaction(async (trx) => {
      variant.useTransaction(trx)
      await variant.merge(fields).save()
      if (optionValueIds) {
        await ProductVariantOptionValue.query({ client: trx })
          .where('product_variant_id', variant.id)
          .delete()
        await this.linkOptionValues(
          variant.id,
          [...optionValueIds, ...(await this.createOptionValues(newOptionValues, trx))],
          trx
        )
      }
      return variant
    })
  }

  protected async createOptionValues(
    values: NewOptionValueData[],
    trx: TransactionClientContract
  ): Promise<string[]> {
    if (values.length === 0) return []
    const created = await ProductOptionValue.createMany(values, { client: trx })
    return created.map(({ id }) => id)
  }

  protected async linkOptionValues(
    variantId: string,
    optionValueIds: string[],
    trx: TransactionClientContract
  ): Promise<void> {
    if (optionValueIds.length === 0) return
    await ProductVariantOptionValue.createMany(
      optionValueIds.map((productOptionValueId) => ({
        productVariantId: variantId,
        productOptionValueId,
      })),
      { client: trx }
    )
  }

  /**
   * Up to `limit` variants of active products, product title then variant
   * position. `available_total` sums stock across locations.
   */
  async searchForOrder(q?: string, limit = 25): Promise<ProductVariant[]> {
    return ProductVariant.query()
      .select('product_variants.*')
      .join('products', 'products.id', 'product_variants.product_id')
      .where('products.status', 'active')
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('products.title', containsPattern(q))
            .orWhereILike('product_variants.title', containsPattern(q))
            .orWhereILike('product_variants.sku', containsPattern(q))
        })
      })
      .withAggregate('inventoryLevels', (levels) => levels.sum('available').as('available_total'))
      .preload('product')
      .orderBy('products.title', 'asc')
      .orderBy('product_variants.position', 'asc')
      .limit(limit)
  }

  async delete(variant: ProductVariant): Promise<void> {
    await variant.delete()
  }

  async loadDetail(variant: ProductVariant): Promise<ProductVariant> {
    await variant.load((loader) => {
      loader
        .load('optionValues', (values) => values.preload('option'))
        .load('inventoryLevels')
        .load('marketPrices')
    })
    return variant
  }
}
