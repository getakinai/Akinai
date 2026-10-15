/**
 * Header row of a product import CSV, in order. One row per variant; rows
 * sharing a `handle` belong to the same product.
 */
export const PRODUCT_IMPORT_COLUMNS = [
  'handle',
  'title',
  'description',
  'status',
  'vendor',
  'product_type',
  'tags',
  'charge_tax',
  'seo_title',
  'seo_description',
  'image_urls',
  'option1_name',
  'option1_value',
  'option2_name',
  'option2_value',
  'option3_name',
  'option3_value',
  'sku',
  'barcode',
  'price',
  'compare_at_price',
  'track_inventory',
  'inventory_quantity',
] as const

export type ProductImportColumn = (typeof PRODUCT_IMPORT_COLUMNS)[number]

/** Separates the URLs in an `image_urls` cell. */
export const IMAGE_URL_SEPARATOR = /[\s|]+/

/** Image URLs downloaded per import, so one request stays bounded. */
export const MAX_IMPORT_IMAGE_URLS = 200

/** Images downloaded at the same time during an import. */
export const IMPORT_IMAGE_CONCURRENCY = 4

export const PRODUCT_IMPORT_SAMPLE_FILENAME = 'products-sample.csv'

export const PRODUCT_IMPORT_SAMPLE_ROWS: Record<ProductImportColumn, string>[] = [
  {
    handle: 'classic-tee',
    title: 'Classic Tee',
    description: '<p>Soft cotton tee for everyday wear.</p>',
    status: 'active',
    vendor: '',
    product_type: '',
    tags: 'cotton, summer',
    charge_tax: 'true',
    seo_title: 'Classic Cotton Tee',
    seo_description: 'A soft cotton tee for everyday wear.',
    image_urls: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&fm=jpg&q=80',
    ].join(' | '),
    option1_name: 'Size',
    option1_value: 'S',
    option2_name: '',
    option2_value: '',
    option3_name: '',
    option3_value: '',
    sku: 'TEE-S',
    barcode: '',
    price: '499.00',
    compare_at_price: '599.00',
    track_inventory: 'true',
    inventory_quantity: '20',
  },
  {
    handle: 'classic-tee',
    title: '',
    description: '',
    status: '',
    vendor: '',
    product_type: '',
    tags: '',
    charge_tax: '',
    seo_title: '',
    seo_description: '',
    image_urls: '',
    option1_name: '',
    option1_value: 'M',
    option2_name: '',
    option2_value: '',
    option3_name: '',
    option3_value: '',
    sku: 'TEE-M',
    barcode: '',
    price: '499.00',
    compare_at_price: '599.00',
    track_inventory: 'true',
    inventory_quantity: '15',
  },
  {
    handle: 'gift-card',
    title: 'Gift Card',
    description: '',
    status: 'draft',
    vendor: '',
    product_type: '',
    tags: '',
    charge_tax: 'false',
    seo_title: '',
    seo_description: '',
    image_urls: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200&fm=jpg&q=80',
    option1_name: '',
    option1_value: '',
    option2_name: '',
    option2_value: '',
    option3_name: '',
    option3_value: '',
    sku: 'GIFT-1000',
    barcode: '',
    price: '1000.00',
    compare_at_price: '',
    track_inventory: 'false',
    inventory_quantity: '',
  },
]
