import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import type Product from '#models/product'
import type ProductVariant from '#models/product_variant'
import OptionDefinitionRepository from '#repositories/option_definition_repository'
import type { VariantMarketPriceData } from '#repositories/price_repository'
import ProductRepository from '#repositories/product_repository'
import ProductVariantRepository, {
  type NewOptionValueData,
  type VariantFieldsData,
} from '#repositories/product_variant_repository'
import PriceService from '#services/price_service'
import { DEFAULT_VARIANT_TITLE } from '#services/variant_combinations'

export type CreateVariantInput = VariantFieldsData & {
  optionValueIds: string[]
  /** Prices in non-primary markets; omitted keeps the saved ones. */
  marketPrices?: VariantMarketPriceData[]
}

export type UpdateVariantInput = VariantFieldsData & {
  optionValueIds?: string[]
  marketPrices?: VariantMarketPriceData[]
}

type ResolvedCombination = {
  title: string
  optionValueIds: string[]
  newOptionValues: NewOptionValueData[]
}

function combinationError(message: string): never {
  throw new errors.E_VALIDATION_ERROR([
    { field: 'optionValueIds', message, rule: 'variantCombination' },
  ])
}

@inject()
export default class ProductVariantService {
  constructor(
    protected productVariantRepository: ProductVariantRepository,
    protected productRepository: ProductRepository,
    protected optionDefinitionRepository: OptionDefinitionRepository,
    protected priceService: PriceService
  ) {}

  /**
   * The parent product with its options and variants, as needed by the
   * create policy and the combination checks.
   */
  async findProductOrFail(productId: string): Promise<Product> {
    return this.productRepository.findWithDetailOrFail(productId)
  }

  /**
   * The variant scoped to `productId`; a variant of another product is a 404.
   */
  async findForProductOrFail(productId: string, id: string): Promise<ProductVariant> {
    return this.productVariantRepository.findForProductOrFail(productId, id)
  }

  /**
   * Adds a variant to a product that has options. Expects the product from
   * `findProductOrFail`.
   */
  async create(product: Product, input: CreateVariantInput): Promise<ProductVariant> {
    const { optionValueIds, marketPrices, ...fields } = input
    const combination = await this.resolveCombination(product, optionValueIds)

    const variant = await this.productVariantRepository.create(product.id, {
      ...fields,
      ...combination,
    })
    if (marketPrices) await this.priceService.syncVariantMarketPrices([variant.id], marketPrices)
    return this.productVariantRepository.loadDetail(variant)
  }

  /**
   * Updates the variant's fields and, when `optionValueIds` is given, moves
   * it to that combination of its product's option values.
   */
  async update(variant: ProductVariant, input: UpdateVariantInput): Promise<ProductVariant> {
    const { optionValueIds, marketPrices, weight, ...rest } = input
    const fields = weight === undefined ? rest : { ...rest, weight }
    const combination = optionValueIds
      ? await this.resolveCombination(
          await this.productRepository.findWithDetailOrFail(variant.productId),
          optionValueIds,
          variant.id
        )
      : {}

    await this.productVariantRepository.update(variant, { ...fields, ...combination })
    if (marketPrices) await this.priceService.syncVariantMarketPrices([variant.id], marketPrices)
    return this.productVariantRepository.loadDetail(variant)
  }

  /**
   * Callers authorize first (ProductPolicy.deleteVariant keeps the last one).
   */
  async delete(variant: ProductVariant): Promise<void> {
    await this.productVariantRepository.delete(variant)
  }

  /**
   * The ids must pick exactly one value from each of the product's options
   * and must not match another variant's combination. An id may be a value
   * the product already has, or a catalog value of the option's definition
   * that the product does not use yet; the latter is returned in
   * `newOptionValues` so it is added to the option. Returns the title built
   * from the values in option order.
   */
  protected async resolveCombination(
    product: Product,
    optionValueIds: string[],
    ignoreVariantId?: string
  ): Promise<ResolvedCombination> {
    const picked = new Set(optionValueIds)
    const catalogValues = await this.optionDefinitionRepository.findValuesInDefinitions(
      optionValueIds,
      product.options.flatMap(({ optionDefinitionId }) =>
        optionDefinitionId ? [optionDefinitionId] : []
      )
    )

    const existingIds: string[] = []
    const newOptionValues: NewOptionValueData[] = []
    const labels = product.options.map((option) => {
      const existing = option.values.filter(
        ({ id, optionDefinitionValueId }) =>
          picked.has(id) ||
          (optionDefinitionValueId !== null && picked.has(optionDefinitionValueId))
      )
      const fromCatalog = catalogValues.filter(
        ({ id, optionDefinitionId }) =>
          optionDefinitionId === option.optionDefinitionId &&
          !option.values.some(({ optionDefinitionValueId }) => optionDefinitionValueId === id)
      )
      if (existing.length + fromCatalog.length !== 1) {
        combinationError(`Choose one ${option.name} value`)
      }

      if (existing.length === 1) {
        existingIds.push(existing[0].id)
        return existing[0].value
      }
      newOptionValues.push({
        productOptionId: option.id,
        optionDefinitionValueId: fromCatalog[0].id,
        value: fromCatalog[0].value,
        position: Math.max(-1, ...option.values.map(({ position }) => position)) + 1,
      })
      return fromCatalog[0].value
    })

    if (labels.length !== picked.size) {
      combinationError('Choose values from this product’s options only')
    }

    if (newOptionValues.length === 0) {
      const key = [...existingIds].sort().join('|')
      const duplicate = product.variants.find(
        (variant) =>
          variant.id !== ignoreVariantId &&
          variant.optionValues
            .map(({ id }) => id)
            .sort()
            .join('|') === key
      )
      if (duplicate) {
        combinationError(`${duplicate.title} already exists`)
      }
    }

    return {
      title: labels.length === 0 ? DEFAULT_VARIANT_TITLE : labels.join(' / '),
      optionValueIds: existingIds,
      newOptionValues,
    }
  }
}
