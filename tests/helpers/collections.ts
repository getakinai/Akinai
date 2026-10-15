import Product, { type ProductStatus } from '#models/product'
import ProductTag from '#models/product_tag'
import ProductType from '#models/product_type'
import ProductVariant from '#models/product_variant'
import Vendor from '#models/vendor'

let sequence = 0

export async function ensureProductType(name: string, isActive = true): Promise<ProductType> {
  return ProductType.firstOrCreate({ name }, { isActive })
}

export async function ensureVendor(name: string, isActive = true): Promise<Vendor> {
  return Vendor.firstOrCreate({ name }, { isActive })
}

export type TestProductInput = {
  title: string
  price?: number
  compareAtPrice?: number | null
  tags?: string[]
  /** Vendor name, created when missing. */
  vendor?: string | null
  /** Product type name, created when missing. */
  productType?: string | null
  status?: ProductStatus
}

/**
 * Creates the products one after another (tests share one transaction).
 */
export async function createTestProducts(titles: string[]): Promise<Product[]> {
  const products: Product[] = []
  for (const title of titles) products.push(await createTestProduct({ title }))
  return products
}

/**
 * Creates a product with a single default variant and the given tags.
 */
export async function createTestProduct({
  title,
  price = 100,
  compareAtPrice = null,
  tags = [],
  vendor = null,
  productType = null,
  status = 'active',
}: TestProductInput): Promise<Product> {
  sequence++
  const type = productType ? await ensureProductType(productType) : null
  const brand = vendor ? await ensureVendor(vendor) : null
  const product = await Product.create({
    title,
    slug: `test-product-${sequence}-${Date.now()}`,
    description: null,
    status,
    productTypeId: type?.id ?? null,
    vendorId: brand?.id ?? null,
  })
  await ProductVariant.create({
    productId: product.id,
    title: 'Default',
    price,
    compareAtPrice,
    trackInventory: false,
    position: 0,
  })
  if (tags.length > 0) {
    await ProductTag.createMany(tags.map((name) => ({ productId: product.id, name })))
  }
  return product
}
