import type Product from '#models/product'
import { imageUrl } from '#utils/image_url'

/**
 * Public URLs of a product's photos: the cover first, then the gallery
 * (preloaded `images`) without repeating the cover.
 */
export function productImageUrls(product: Product): string[] {
  const { coverImage, images } = product
  return [
    ...(coverImage ? [coverImage] : []),
    ...images.map(({ path }) => path).filter((path) => path !== coverImage),
  ].map((path) => imageUrl(path))
}
