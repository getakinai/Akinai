import type Location from '#models/location'
import type Product from '#models/product'
import ProductVariantTransformer from '#transformers/product_variant_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'
import { extraNumber } from '#utils/extra_number'

/**
 * `toObject` is the list row and reads the `variants_count`,
 * `available_total`, `price_min` and `price_max` extras from
 * ProductRepository.paginate. `toDetail` expects the relations (including
 * productType and vendor) loaded by
 * ProductRepository.findWithDetailOrFail and the active locations.
 */
export default class ProductTransformer extends BaseTransformer<Product> {
  protected locations: Location[]

  constructor(resource: Product, locations: Location[] = []) {
    super(resource)
    this.locations = locations
  }

  protected base() {
    return this.pick(this.resource, [
      'id',
      'title',
      'slug',
      'description',
      'productTypeId',
      'vendorId',
      'productLabelId',
      'status',
      'chargeTax',
      'freeShipping',
      'archivedAt',
      'createdAt',
      'updatedAt',
    ])
  }

  toObject() {
    const { $extras } = this.resource

    return {
      ...this.base(),
      coverImageUrl: this.resource.coverImage ? imageUrl(this.resource.coverImage) : null,
      variantsCount: extraNumber($extras.variants_count),
      availableTotal: extraNumber($extras.available_total),
      priceMin: extraNumber($extras.price_min),
      priceMax: extraNumber($extras.price_max),
      missingPriceCurrencies: Array.isArray($extras.missing_price_currencies)
        ? ($extras.missing_price_currencies as string[])
        : [],
    }
  }

  toDetail() {
    const { productType, vendor, productLabel } = this.resource

    return {
      ...this.base(),
      ...this.pick(this.resource, ['seoTitle', 'seoDescription']),
      productType: productType
        ? { id: productType.id, name: productType.name, isActive: productType.isActive }
        : null,
      vendor: vendor ? { id: vendor.id, name: vendor.name, isActive: vendor.isActive } : null,
      productLabel: productLabel
        ? {
            id: productLabel.id,
            name: productLabel.name,
            color: productLabel.color,
            isActive: productLabel.isActive,
          }
        : null,
      tags: this.resource.tags.map(({ name }) => name),
      coverImage: this.resource.coverImage
        ? { key: this.resource.coverImage, url: imageUrl(this.resource.coverImage) }
        : null,
      galleryImages: this.resource.images.map(({ path }) => ({ key: path, url: imageUrl(path) })),
      options: this.resource.options.map((option) => ({
        id: option.id,
        optionDefinitionId: option.optionDefinitionId,
        name: option.name,
        position: option.position,
        values: option.values.map(({ id, optionDefinitionValueId, value, position }) => ({
          id,
          optionDefinitionValueId,
          value,
          position,
        })),
      })),
      variants: ProductVariantTransformer.transform(this.resource.variants, this.locations),
      reviewsCount: extraNumber(this.resource.$extras.reviews_count) ?? 0,
      locations: this.locations.map(({ id, name, isDefault }) => ({ id, name, isDefault })),
    }
  }
}
