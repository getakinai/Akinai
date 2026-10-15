import type Product from '#models/product'
import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { productImageUrls } from '#utils/product_image_urls'
import { sanitizeRichText } from '#utils/sanitize_rich_text'
import { storefrontProductLabel } from '#utils/storefront_product_label'

/**
 * The variant's price in the shopper's market: the preloaded `marketPrices`
 * row outside the primary market (null when there is none), else its own.
 */
function marketPrice(variant: ProductVariant) {
  const rows = variant.$preloaded.marketPrices as ProductVariant['marketPrices'] | undefined
  if (!rows) return { price: variant.price, compareAtPrice: variant.compareAtPrice }
  const row = rows[0]
  return { price: row?.price ?? null, compareAtPrice: row?.compareAtPrice ?? null }
}

/**
 * Product detail page payload from StorefrontCatalogRepository.findActiveProductBySlug.
 * Each variant's `optionValues` line up with `options` by index (null when
 * the variant has no value for that option). `price` is null when the
 * variant can't be bought in the market. `compareAtPrice` is only set when
 * it is above the price.
 */
export default class StorefrontProductTransformer extends BaseTransformer<Product> {
  toObject() {
    const { vendor, productType, options, variants } = this.resource

    return {
      ...this.pick(this.resource, ['id', 'title', 'slug', 'seoTitle', 'seoDescription']),
      vendor: vendor ? vendor.name : null,
      category: productType ? productType.name : null,
      label: storefrontProductLabel(this.resource),
      description: sanitizeRichText(this.resource.description),
      images: productImageUrls(this.resource),
      options: options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => value.value),
      })),
      variants: variants.map((variant) => {
        const { price, compareAtPrice } = marketPrice(variant)
        return {
          id: variant.id,
          title: variant.title,
          price,
          compareAtPrice:
            price !== null && compareAtPrice !== null && compareAtPrice > price
              ? compareAtPrice
              : null,
          optionValues: options.map(
            (option) =>
              variant.optionValues.find((value) => value.productOptionId === option.id)?.value ??
              null
          ),
        }
      }),
    }
  }
}
