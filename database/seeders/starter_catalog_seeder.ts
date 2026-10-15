import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CollectionService from '#services/collection_service'
import CountryPresetService from '#services/country_preset_service'
import PriceService from '#services/price_service'
import ProductService from '#services/product_service'
import ProductTypeService from '#services/product_type_service'
import VendorService from '#services/vendor_service'

type StarterProduct = { title: string; vendor: string; nzd: number; aud: number }

type StarterCollection = {
  tag: string
  title: string
  slug: string
  productType: string
  description: string
  products: [StarterProduct, StarterProduct]
}

/**
 * Slugs and tags match the demo catalog (`database/demo`), so running
 * `node ace seed:demo-store` afterwards fills these collections instead of
 * duplicating them.
 */
const COLLECTIONS: StarterCollection[] = [
  {
    tag: 'gift-boxes',
    title: 'Gift Boxes',
    slug: 'gift-boxes',
    productType: 'Gift box',
    description: 'Ready-made gift boxes for birthdays, holidays and just because.',
    products: [
      { title: 'Pasalubong Gift Box', vendor: 'Akinai', nzd: 49.99, aud: 45.99 },
      { title: 'Birthday Treats Box', vendor: 'Akinai', nzd: 59.99, aud: 54.99 },
    ],
  },
  {
    tag: 'snacks',
    title: 'Snacks',
    slug: 'snacks',
    productType: 'Snacks',
    description: 'Chips, crackers and dried fruit for every craving.',
    products: [
      { title: '7D Dried Mangoes 200g', vendor: '7D', nzd: 11.99, aud: 10.99 },
      { title: 'Piattos Cheese 85g', vendor: 'Jack n Jill', nzd: 2.49, aud: 2.29 },
    ],
  },
  {
    tag: 'sweets',
    title: 'Sweets & Pastries',
    slug: 'sweets-and-pastries',
    productType: 'Cakes and pastries',
    description: 'Cakes, pastries and classic Filipino sweets.',
    products: [
      { title: 'Goldilocks Polvoron 12-pack', vendor: 'Goldilocks', nzd: 8.99, aud: 8.29 },
      { title: 'Red Ribbon Mango Cake', vendor: 'Red Ribbon', nzd: 32.99, aud: 29.99 },
    ],
  },
  {
    tag: 'pantry',
    title: 'Pantry Staples',
    slug: 'pantry-staples',
    productType: 'Grocery',
    description: 'Rice, noodles, canned goods and sauces for everyday cooking.',
    products: [
      { title: 'Jasmine Rice 5kg', vendor: 'Akinai', nzd: 14.99, aud: 13.99 },
      {
        title: 'Lucky Me Pancit Canton Original 6-pack',
        vendor: 'Lucky Me',
        nzd: 4.49,
        aud: 4.19,
      },
    ],
  },
  {
    tag: 'personal-care',
    title: 'Personal Care',
    slug: 'personal-care',
    productType: 'Personal care',
    description: 'Soap, shampoo and everyday care for the whole family.',
    products: [
      { title: 'Safeguard Bar Soap 3-pack', vendor: 'Safeguard', nzd: 4.99, aud: 4.59 },
      { title: 'Palmolive Shampoo 340ml', vendor: 'Palmolive', nzd: 7.49, aud: 6.99 },
    ],
  },
]

/**
 * A minimal catalog so a fresh store has something to browse: 10 active
 * products in 5 automated collections, priced in NZD and AUD. Development
 * only, and only for countries of operation whose preset asks for it.
 * Runs after the country preset and location seeders (seeders run in file
 * name order). Safe to re-run: existing products and collections are
 * skipped.
 */
export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const countryPresetService = await app.container.make(CountryPresetService)
    if (!(await countryPresetService.forStore())?.starterCatalog) return

    const collectionService = await app.container.make(CollectionService)
    const priceService = await app.container.make(PriceService)
    const productService = await app.container.make(ProductService)
    const productTypeService = await app.container.make(ProductTypeService)
    const vendorService = await app.container.make(VendorService)

    const markets = await priceService.pricingMarkets()
    const aud = markets.find(({ currencyCode }) => currencyCode === 'AUD')
    const slugOf = (title: string) => string.slug(title, { lower: true, strict: true })
    const taken = await productService.existingSlugs(
      COLLECTIONS.flatMap(({ products }) => products.map(({ title }) => slugOf(title)))
    )

    for (const collection of COLLECTIONS) {
      if (!(await collectionService.findBySlug(collection.slug))) {
        await collectionService.create({
          title: collection.title,
          slug: collection.slug,
          type: 'automated',
          status: 'active',
          description: `<p>${collection.description}</p>`,
          sortOrder: 'title_asc',
          rules: [{ field: 'tag', operator: 'equals', value: collection.tag }],
        })
      }

      const productType = await productTypeService.ensure(collection.productType)
      for (const product of collection.products) {
        if (taken.has(slugOf(product.title))) continue
        const vendor = await vendorService.ensure(product.vendor)
        await productService.create({
          title: product.title,
          description: `<p>${product.title} from ${product.vendor}. ${collection.description}</p>`,
          status: 'active',
          productTypeId: productType.id,
          vendorId: vendor.id,
          tags: [collection.tag],
          price: product.nzd,
          marketPrices: aud
            ? [{ marketId: aud.id, price: product.aud, compareAtPrice: null }]
            : undefined,
          options: [],
        })
      }
    }
  }
}
