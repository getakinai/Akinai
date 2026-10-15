import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CollectionService, { type CreateCollectionInput } from '#services/collection_service'
import PriceService from '#services/price_service'
import ProductService from '#services/product_service'
import ProductTypeService from '#services/product_type_service'
import StorefrontMenuService, { MAX_MENU_ITEMS } from '#services/storefront_menu_service'
import VendorService from '#services/vendor_service'
import CatalogDefaultSeeder from './catalog_default_seeder.js'
import ExampleCollectionSeeder from './example_collection_seeder.js'
import OptionDefinitionSeeder from './option_definition_seeder.js'

type DemoProduct = [title: string, vendor: string, price: number]

type DemoCategory = {
  tag: string
  title: string
  slug: string
  productType: string
  description: string
  products: DemoProduct[]
}

export const DEMO_TAG = 'demo'

const CATEGORIES: DemoCategory[] = [
  {
    tag: 'produce',
    title: 'Fresh Produce',
    slug: 'fresh-produce',
    productType: 'Fresh produce',
    description: 'Seasonal fruit and vegetables, picked and packed daily.',
    products: [
      ['Bananas 1kg', 'Farm Fresh Co', 3.99],
      ['Carabao Mangoes 1kg', 'Farm Fresh Co', 8.99],
      ['Calamansi 250g', 'Farm Fresh Co', 4.5],
      ['Red Onions 1kg', 'Farm Fresh Co', 3.49],
      ['Garlic 250g', 'Farm Fresh Co', 2.99],
      ['Vine Tomatoes 500g', 'Farm Fresh Co', 4.29],
      ['Kangkong Bunch', 'Farm Fresh Co', 2.79],
      ['Pechay Bunch', 'Farm Fresh Co', 2.99],
      ['Sweet Potatoes 1kg', 'Farm Fresh Co', 4.99],
      ['Eggplant 500g', 'Farm Fresh Co', 3.79],
      ['Ampalaya 500g', 'Farm Fresh Co', 4.49],
      ['Baby Potatoes 1kg', 'Farm Fresh Co', 3.99],
      ['Fresh Ginger 200g', 'Farm Fresh Co', 2.49],
      ['Pineapple Each', 'Farm Fresh Co', 5.49],
      ['Papaya Each', 'Farm Fresh Co', 4.99],
    ],
  },
  {
    tag: 'snacks',
    title: 'Snacks',
    slug: 'snacks',
    productType: 'Snacks',
    description: 'Chips, crackers and dried fruit for every craving.',
    products: [
      ['Piattos Cheese 85g', 'Jack n Jill', 2.49],
      ['Nova Multigrain 78g', 'Jack n Jill', 2.29],
      ['Chippy Barbecue 110g', 'Jack n Jill', 2.19],
      ['V-Cut Spicy Barbecue 60g', 'Jack n Jill', 1.99],
      ['Mr. Chips Nacho 100g', 'Jack n Jill', 2.29],
      ['SkyFlakes Crackers 10-pack', 'Monde', 4.99],
      ['Fita Crackers 300g', 'Monde', 3.99],
      ['Rebisco Crackers 10-pack', 'Rebisco', 4.49],
      ['Hansel Mocha Sandwich 10-pack', 'Rebisco', 3.79],
      ['7D Dried Mangoes 100g', '7D', 6.99],
      ['7D Dried Mangoes 200g', '7D', 11.99],
      ['7D Dried Pineapple 100g', '7D', 6.49],
      ['Cornick Garlic 100g', 'Akinai', 2.49],
      ['Banana Chips 200g', 'Akinai', 3.99],
      ['Chicharon 90g', 'Akinai', 3.49],
    ],
  },
  {
    tag: 'beverages',
    title: 'Drinks & Coffee',
    slug: 'drinks-and-coffee',
    productType: 'Beverages',
    description: 'Coffee, juice and drinks to keep the pantry stocked.',
    products: [
      ['Kopiko Brown Coffee 10-pack', 'Kopiko', 5.99],
      ['Kopiko Blanca 10-pack', 'Kopiko', 5.99],
      ['Nescafe 3in1 Original 10-pack', 'Nestle', 5.49],
      ['Milo Powder 300g', 'Nestle', 7.99],
      ['Bear Brand Powdered Milk 320g', 'Nestle', 8.99],
      ['Nestea Lemon Iced Tea 450g', 'Nestle', 6.49],
      ['Zesto Orange 10-pack', 'Zesto', 4.99],
      ['Zesto Mango 10-pack', 'Zesto', 4.99],
      ['Del Monte Pineapple Juice 1L', 'Del Monte', 3.99],
      ['Del Monte Four Seasons 1L', 'Del Monte', 3.99],
      ['Calamansi Juice Concentrate 500ml', 'Akinai', 5.49],
      ['Salabat Ginger Tea 10-pack', 'Akinai', 4.49],
      ['Barako Ground Coffee 250g', 'Akinai', 9.99],
      ['Tablea Chocolate 200g', 'Akinai', 7.49],
      ['Coconut Water 1L', 'Akinai', 4.29],
    ],
  },
  {
    tag: 'pantry',
    title: 'Pantry Staples',
    slug: 'pantry-staples',
    productType: 'Grocery',
    description: 'Rice, noodles, canned goods and sauces for everyday cooking.',
    products: [
      ['Lucky Me Pancit Canton Original 6-pack', 'Lucky Me', 4.49],
      ['Lucky Me Pancit Canton Chilimansi 6-pack', 'Lucky Me', 4.49],
      ['Lucky Me Beef Mami 6-pack', 'Lucky Me', 3.99],
      ['Century Tuna Flakes in Oil 180g', 'Century', 2.99],
      ['Century Tuna Hot and Spicy 180g', 'Century', 2.99],
      ['Purefoods Corned Beef 210g', 'Purefoods', 4.49],
      ['Purefoods Vienna Sausage 130g', 'Purefoods', 2.49],
      ['Del Monte Sweet Spaghetti Sauce 1kg', 'Del Monte', 5.49],
      ['Del Monte Tomato Sauce 250g', 'Del Monte', 1.49],
      ['Jasmine Rice 5kg', 'Akinai', 14.99],
      ['Soy Sauce 1L', 'Akinai', 3.99],
      ['Cane Vinegar 1L', 'Akinai', 3.49],
      ['Adobo Seasoning Mix 50g', 'Akinai', 1.79],
      ['Banana Ketchup 320g', 'Akinai', 2.99],
      ['Bihon Rice Noodles 454g', 'Akinai', 3.29],
    ],
  },
  {
    tag: 'sweets',
    title: 'Sweets & Pastries',
    slug: 'sweets-and-pastries',
    productType: 'Cakes and pastries',
    description: 'Cakes, pastries and classic Filipino sweets.',
    products: [
      ['Goldilocks Polvoron 12-pack', 'Goldilocks', 8.99],
      ['Goldilocks Mamon 6-pack', 'Goldilocks', 7.49],
      ['Goldilocks Ube Roll', 'Goldilocks', 18.99],
      ['Red Ribbon Black Forest Cake', 'Red Ribbon', 34.99],
      ['Red Ribbon Mango Cake', 'Red Ribbon', 32.99],
      ['Red Ribbon Chocolate Mousse Slice', 'Red Ribbon', 6.49],
      ['Red Ribbon Ensaymada 4-pack', 'Red Ribbon', 9.99],
      ['Monde Mamon 10-pack', 'Monde', 5.49],
      ['Ube Halaya 340g', 'Akinai', 8.49],
      ['Yema Spread 220g', 'Akinai', 6.49],
      ['Otap Biscuits 200g', 'Akinai', 5.99],
      ['Pastillas de Leche 12-pack', 'Akinai', 6.99],
      ['Hopia Mongo 6-pack', 'Akinai', 5.49],
      ['Buko Pie', 'Akinai', 14.99],
      ['Leche Flan Tub', 'Akinai', 9.49],
    ],
  },
  {
    tag: 'personal-care',
    title: 'Personal Care',
    slug: 'personal-care',
    productType: 'Personal care',
    description: 'Soap, shampoo and everyday care for the whole family.',
    products: [
      ['Safeguard Bar Soap 3-pack', 'Safeguard', 4.99],
      ['Safeguard Body Wash 400ml', 'Safeguard', 8.49],
      ['Palmolive Shampoo 340ml', 'Palmolive', 7.49],
      ['Palmolive Conditioner 340ml', 'Palmolive', 7.49],
      ['Palmolive Naturals Soap 3-pack', 'Palmolive', 4.49],
      ['Colgate Toothpaste 150g', 'Colgate', 4.29],
      ['Colgate Toothbrush 2-pack', 'Colgate', 4.99],
      ["Johnson's Baby Powder 200g", "Johnson's", 5.99],
      ["Johnson's Baby Shampoo 500ml", "Johnson's", 8.99],
      ['Efficascent Oil 100ml', 'Akinai', 6.49],
      ['Katinko Ointment 10g', 'Akinai', 2.99],
      ['Cotton Buds 200-pack', 'Akinai', 2.49],
      ['Aloe Vera Gel 250ml', 'Akinai', 6.99],
      ['Hand Sanitizer 500ml', 'Akinai', 5.49],
      ['Facial Tissues 3-pack', 'Akinai', 4.79],
    ],
  },
  {
    tag: 'household',
    title: 'Household',
    slug: 'household',
    productType: 'Household essentials',
    description: 'Cleaning and laundry essentials for a tidy home.',
    products: [
      ['Downy Fabric Conditioner Sunrise Fresh 1L', 'Downy', 7.99],
      ['Downy Antibac Fabric Conditioner 1L', 'Downy', 7.99],
      ['Downy Garden Bloom Refill 1.5L', 'Downy', 10.49],
      ['Laundry Powder 1kg', 'Akinai', 6.99],
      ['Calamansi Dishwashing Liquid 500ml', 'Akinai', 3.99],
      ['Kitchen Sponges 6-pack', 'Akinai', 3.49],
      ['Paper Towels 4-roll', 'Akinai', 6.49],
      ['Toilet Paper 12-roll', 'Akinai', 12.99],
      ['Large Trash Bags 30-pack', 'Akinai', 5.99],
      ['Glass Cleaner 500ml', 'Akinai', 4.49],
      ['Floor Cleaner 1L', 'Akinai', 5.49],
      ['Insect Spray 500ml', 'Akinai', 6.99],
      ['Mosquito Coils 10-pack', 'Akinai', 3.99],
      ['Soft Broom', 'Akinai', 14.99],
      ['Bleach 1L', 'Akinai', 3.29],
    ],
  },
]

const EXTRA_COLLECTIONS: (CreateCollectionInput & { slug: string })[] = [
  {
    title: 'Under $5',
    slug: 'under-5',
    type: 'automated',
    status: 'active',
    description: '<p>Everyday favourites that cost less than $5.</p>',
    sortOrder: 'price_asc',
    rules: [{ field: 'variant_price', operator: 'less_than', value: '5' }],
  },
]

export type DemoStoreSummary = {
  products: number
  collections: number
  menuItems: number
}

/**
 * Demo AUD price for an NZD amount, ending in 9. Demo data only; real AUD
 * prices are entered by hand.
 */
function demoAudPrice(nzd: number): number {
  return Number((Math.ceil(nzd * 0.92 * 10) / 10 - 0.01).toFixed(2))
}

/**
 * Demo catalog for trying out the storefront: sample product types,
 * vendors and options, draft example collections, and active products (no
 * images, priced in NZD and AUD) in automated collections linked from the
 * store menu. Lives outside `database/seeders` so `db:seed` never runs it;
 * run it with `node ace seed:demo-store` after `db:seed`. Safe to re-run:
 * existing records are skipped.
 */
export default class DemoStoreSeeder extends BaseSeeder {
  summary: DemoStoreSummary = { products: 0, collections: 0, menuItems: 0 }

  async run() {
    await new CatalogDefaultSeeder(this.client).run()
    await new OptionDefinitionSeeder(this.client).run()
    await new ExampleCollectionSeeder(this.client).run()

    const collections = await this.seedCollections()
    await this.seedProducts()
    await this.seedMenu(collections)
  }

  protected async seedCollections(): Promise<{ id: string; title: string }[]> {
    const collectionService = await app.container.make(CollectionService)
    const inputs: (CreateCollectionInput & { slug: string })[] = [
      ...CATEGORIES.map(({ tag, title, slug, description }) => ({
        title,
        slug,
        type: 'automated' as const,
        status: 'active' as const,
        description: `<p>${description}</p>`,
        sortOrder: 'title_asc' as const,
        rules: [{ field: 'tag' as const, operator: 'equals' as const, value: tag }],
      })),
      ...EXTRA_COLLECTIONS,
    ]

    const collections: { id: string; title: string }[] = []
    for (const input of inputs) {
      const existing = await collectionService.findBySlug(input.slug)
      if (existing) {
        collections.push({ id: existing.id, title: existing.title })
        continue
      }
      const collection = await collectionService.create(input)
      collections.push({ id: collection.id, title: collection.title })
      this.summary.collections++
    }
    return collections
  }

  protected async seedProducts() {
    const productService = await app.container.make(ProductService)
    const productTypeService = await app.container.make(ProductTypeService)
    const vendorService = await app.container.make(VendorService)
    const priceService = await app.container.make(PriceService)

    const markets = await priceService.pricingMarkets()
    const aud = markets.find(({ currencyCode }) => currencyCode === 'AUD')
    const slugOf = (title: string) => string.slug(title, { lower: true, strict: true })
    const taken = await productService.existingSlugs(
      CATEGORIES.flatMap(({ products }) => products.map(([title]) => slugOf(title)))
    )

    const vendorIds = new Map<string, string>()
    for (const category of CATEGORIES) {
      const productType = await productTypeService.ensure(category.productType)

      for (const [title, vendorName, price] of category.products) {
        if (taken.has(slugOf(title))) continue

        if (!vendorIds.has(vendorName)) {
          const vendor = await vendorService.ensure(vendorName)
          vendorIds.set(vendorName, vendor.id)
        }

        await productService.create({
          title,
          description: `<p>${title} from ${vendorName}. ${category.description}</p>`,
          status: 'active',
          productTypeId: productType.id,
          vendorId: vendorIds.get(vendorName),
          tags: [category.tag, DEMO_TAG],
          price,
          marketPrices: aud
            ? [{ marketId: aud.id, price: demoAudPrice(price), compareAtPrice: null }]
            : undefined,
          options: [],
        })
        this.summary.products++
      }
    }
  }

  protected async seedMenu(collections: { id: string; title: string }[]) {
    const menuService = await app.container.make(StorefrontMenuService)
    const items = await menuService.list()
    const linked = new Set(items.map((item) => item.collectionId).filter(Boolean))
    let count = items.length

    if (!items.some((item) => item.type === 'url' && item.url === '/')) {
      if (count >= MAX_MENU_ITEMS) return
      await menuService.create({ label: 'Home', type: 'url', url: '/' })
      this.summary.menuItems++
      count++
    }

    for (const { id, title } of collections) {
      if (linked.has(id) || count >= MAX_MENU_ITEMS) continue
      await menuService.create({ label: title, type: 'collection', collectionId: id })
      this.summary.menuItems++
      count++
    }
  }
}
