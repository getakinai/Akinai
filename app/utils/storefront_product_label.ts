import type Product from '#models/product'

/**
 * The product's label badge for the storefront, or null when it has none.
 * Storefront queries preload only active labels, so an archived label is
 * null here too.
 */
export function storefrontProductLabel(product: Product) {
  const label = product.productLabel
  return label ? { name: label.name, color: label.color } : null
}
