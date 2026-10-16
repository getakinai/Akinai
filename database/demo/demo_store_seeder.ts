import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CollectionService, { type CreateCollectionInput } from '#services/collection_service'
import PageRepository from '#repositories/page_repository'
import PageService from '#services/page_service'
import PriceService from '#services/price_service'
import ProductService from '#services/product_service'
import ProductTypeService from '#services/product_type_service'
import StorefrontBrandingService from '#services/storefront_branding_service'
import StorefrontMenuService, { MAX_MENU_ITEMS } from '#services/storefront_menu_service'
import VendorService from '#services/vendor_service'
import { importAppledbCover, uploadAppledbToFolder } from './appledb_image.js'
import CatalogDefaultSeeder from './catalog_default_seeder.js'
import OptionDefinitionSeeder from './option_definition_seeder.js'

type DemoProduct = {
  title: string
  vendor: string
  price: number
  description: string
  deviceKey: string
  color: string
  sku?: string
}

type DemoCategory = {
  tag: string
  title: string
  slug: string
  productType: string
  description: string
  products: DemoProduct[]
}

export const DEMO_TAG = 'demo'
export const DEMO_BRAND_NAME = 'Akinai Gadgets'

const CATEGORIES: DemoCategory[] = [
  {
    tag: 'iphone',
    title: 'iPhone',
    slug: 'iphone',
    productType: 'Smartphone',
    description: 'The latest iPhone models, finishes and storage options.',
    products: [
      {
        title: 'iPhone 15 128GB Black',
        vendor: 'Apple',
        price: 799,
        sku: 'APL-IPH15-128-BLK',
        deviceKey: 'iPhone15,4',
        color: 'Black',
        description:
          '<p>iPhone 15 with the A16 Bionic chip, a 6.1-inch Super Retina XDR display, and a 48MP Main camera that shoots in stunning detail. Dynamic Island keeps alerts and activities front and centre. USB-C charging, Crash Detection, and all-day battery life in a durable aluminium design finished in Black.</p>',
      },
      {
        title: 'iPhone 15 256GB Blue',
        vendor: 'Apple',
        price: 899,
        sku: 'APL-IPH15-256-BLU',
        deviceKey: 'iPhone15,4',
        color: 'Blue',
        description:
          '<p>iPhone 15 in Blue with 256GB of storage for photos, apps and 4K video. The advanced dual-camera system delivers sharper detail and richer colour, while the Ceramic Shield front is tougher than any smartphone glass. A16 Bionic powers smooth gaming, photography and everyday multitasking.</p>',
      },
      {
        title: 'iPhone 15 Pro 256GB Natural Titanium',
        vendor: 'Apple',
        price: 1099,
        sku: 'APL-IPH15P-256-NTT',
        deviceKey: 'iPhone16,1',
        color: 'Natural Titanium',
        description:
          '<p>iPhone 15 Pro in aerospace-grade Natural Titanium with the A17 Pro chip and a pro camera system including a 48MP Main and 3x Telephoto. Action button, USB-C with USB 3 speeds, and a ProMotion always-on display make this the most capable pro iPhone yet. 256GB storage.</p>',
      },
      {
        title: 'iPhone 15 Pro Max 512GB White Titanium',
        vendor: 'Apple',
        price: 1399,
        sku: 'APL-IPH15PM-512-WTT',
        deviceKey: 'iPhone16,2',
        color: 'White Titanium',
        description:
          '<p>iPhone 15 Pro Max in White Titanium with 512GB storage and the largest Super Retina XDR display in the Pro lineup. A17 Pro unlocks console-class games, while the 5x Telephoto camera brings distant subjects closer with remarkable clarity. Built for creators who need space and power.</p>',
      },
      {
        title: 'iPhone 16 128GB Ultramarine',
        vendor: 'Apple',
        price: 799,
        sku: 'APL-IPH16-128-ULT',
        deviceKey: 'iPhone17,3',
        color: 'Ultramarine',
        description:
          '<p>iPhone 16 in Ultramarine with the A18 chip, Camera Control for faster photo and video capture, and a refined dual-camera system. Built for Apple Intelligence features, longer battery life, and a vibrant 6.1-inch display. 128GB is ready for everyday photos, streaming and apps.</p>',
      },
      {
        title: 'iPhone 16 Pro 256GB Desert Titanium',
        vendor: 'Apple',
        price: 1099,
        sku: 'APL-IPH16P-256-DTT',
        deviceKey: 'iPhone17,1',
        color: 'Desert Titanium',
        description:
          '<p>iPhone 16 Pro in Desert Titanium with A18 Pro, a 48MP Fusion camera system, and 4K 120 fps Dolby Vision video. Camera Control and a customisable Action button keep tools one press away. Thin titanium design, ProMotion display, and 256GB storage for pro workflows.</p>',
      },
    ],
  },
  {
    tag: 'mac',
    title: 'Mac',
    slug: 'mac',
    productType: 'Laptop',
    description: 'MacBook Air and MacBook Pro for work, study and creativity.',
    products: [
      {
        title: 'MacBook Air 15-inch M3 Space Gray',
        vendor: 'Apple',
        price: 1299,
        deviceKey: 'Mac15,3',
        color: 'Space Gray',
        description:
          '<p>MacBook Air 15-inch with the M3 chip delivers exceptional performance and up to 18 hours of battery life in a strikingly thin design. Liquid Retina display, MagSafe charging, and a spacious keyboard make it ideal for everyday productivity and entertainment. Finished in Space Gray.</p>',
      },
      {
        title: 'MacBook Air 15-inch M3 Silver',
        vendor: 'Apple',
        price: 1299,
        deviceKey: 'Mac15,3',
        color: 'Silver',
        description:
          '<p>The 15-inch MacBook Air in Silver pairs the M3 chip with a large Liquid Retina display and silent, fanless design. Perfect for multitasking across apps, editing photos, and streaming — all with all-day battery and a durable aluminium unibody.</p>',
      },
      {
        title: 'MacBook Pro 14-inch M3 Pro Space Black',
        vendor: 'Apple',
        price: 1999,
        deviceKey: 'Mac15,6',
        color: 'Space Black',
        description:
          '<p>MacBook Pro 14-inch with M3 Pro brings pro performance for video, code and 3D. Liquid Retina XDR display, advanced thermal design, and a rich port selection including HDMI and SDXC. Space Black finish with up to 22 hours of battery life.</p>',
      },
      {
        title: 'MacBook Pro 16-inch M1 Pro Silver',
        vendor: 'Apple',
        price: 2499,
        deviceKey: 'MacBookPro18,1',
        color: 'Silver',
        description:
          '<p>MacBook Pro 16-inch with M1 Pro offers a vast Liquid Retina XDR canvas, studio-quality mics and speakers, and desktop-class performance in a portable frame. Ideal for colour-critical editing, music production and heavy multitasking. Silver finish.</p>',
      },
      {
        title: 'MacBook Pro 14-inch M1 Pro Space Gray',
        vendor: 'Apple',
        price: 1899,
        deviceKey: 'MacBookPro18,3',
        color: 'Space Gray',
        description:
          '<p>MacBook Pro 14-inch with M1 Pro balances power and portability. Extreme Dynamic Range display, ProRes acceleration, and a MagSafe 3 connector keep creators productive anywhere. Finished in classic Space Gray.</p>',
      },
    ],
  },
  {
    tag: 'ipad',
    title: 'iPad',
    slug: 'ipad',
    productType: 'Tablet',
    description: 'iPad models for drawing, learning and entertainment on the go.',
    products: [
      {
        title: 'iPad Pro 11-inch M4 Space Black',
        vendor: 'Apple',
        price: 999,
        deviceKey: 'iPad16,3',
        color: 'Space Black',
        description:
          '<p>iPad Pro 11-inch with M4 delivers ultra-thin design, a stunning Ultra Retina XDR display, and pro-level performance for illustration, editing and multitasking. Works with Apple Pencil Pro and Magic Keyboard. Space Black.</p>',
      },
      {
        title: 'iPad Pro 11-inch M4 Silver',
        vendor: 'Apple',
        price: 999,
        deviceKey: 'iPad16,3',
        color: 'Silver',
        description:
          '<p>iPad Pro 11-inch in Silver with the M4 chip and Ultra Retina XDR display. Blazing graphics, AI acceleration, and all-day battery make it a studio you can hold in one hand. Compatible with Apple Pencil Pro.</p>',
      },
      {
        title: 'iPad Pro 13-inch M4 Space Black',
        vendor: 'Apple',
        price: 1299,
        deviceKey: 'iPad16,5',
        color: 'Space Black',
        description:
          '<p>iPad Pro 13-inch with M4 offers the largest Ultra Retina XDR canvas in the lineup — ideal for sketching, sheet music and multi-window work. Remarkably thin, powerful and ready for Apple Pencil Pro. Space Black.</p>',
      },
      {
        title: 'iPad mini A17 Pro Blue',
        vendor: 'Apple',
        price: 499,
        deviceKey: 'iPad16,1',
        color: 'Blue',
        description:
          '<p>iPad mini with A17 Pro packs desktop-class performance into an 8.3-inch Liquid Retina display. Perfect for reading, note-taking and gaming on the go. Supports Apple Pencil Pro. Finished in Blue.</p>',
      },
      {
        title: 'iPad mini A17 Pro Starlight',
        vendor: 'Apple',
        price: 499,
        deviceKey: 'iPad16,1',
        color: 'Starlight',
        description:
          '<p>iPad mini in Starlight with A17 Pro, all-day battery, and a compact form factor that fits in a bag or jacket pocket. Great for travel, comics and quick creative sessions with Apple Pencil Pro.</p>',
      },
    ],
  },
  {
    tag: 'audio',
    title: 'AirPods & Audio',
    slug: 'airpods-and-audio',
    productType: 'Audio',
    description: 'AirPods, AirPods Max and wireless audio from Apple.',
    products: [
      {
        title: 'AirPods Pro 2 USB-C',
        vendor: 'Apple',
        price: 249,
        deviceKey: 'AirPodsPro1,2-usbc-case',
        color: 'White',
        description:
          '<p>AirPods Pro (2nd generation) with USB-C MagSafe Charging Case. Active Noise Cancellation, Adaptive Audio, Transparency mode and Personalized Spatial Audio deliver an immersive listen. Up to 6 hours of listening with ANC on a single charge.</p>',
      },
      {
        title: 'AirPods 4',
        vendor: 'Apple',
        price: 129,
        deviceKey: 'AirPods1,4-case',
        color: 'White',
        description:
          '<p>AirPods 4 bring a refined open-ear design, richer audio and improved call quality powered by the H2 chip. Effortless setup with every Apple device, automatic switching, and a compact charging case for all-day listening.</p>',
      },
      {
        title: 'AirPods Max Silver',
        vendor: 'Apple',
        price: 549,
        deviceKey: 'AirPodsMax1,1',
        color: 'Silver',
        description:
          '<p>AirPods Max combine high-fidelity audio with industry-leading Active Noise Cancellation and a breathable knit mesh canopy. Computational audio, Spatial Audio with dynamic head tracking, and up to 20 hours of listening. Silver.</p>',
      },
      {
        title: 'AirPods Max Space Gray',
        vendor: 'Apple',
        price: 549,
        deviceKey: 'AirPodsMax1,1',
        color: 'Space Gray',
        description:
          '<p>AirPods Max in Space Gray deliver studio-quality sound with ANC and Transparency modes. Custom acoustic design, Digital Crown volume control, and a Smart Case that preserves battery when you are on the move.</p>',
      },
      {
        title: 'AirPods Max Sky Blue',
        vendor: 'Apple',
        price: 549,
        deviceKey: 'AirPodsMax1,1',
        color: 'Sky Blue',
        description:
          '<p>AirPods Max in Sky Blue with over-ear memory foam cushions, Active Noise Cancellation and Personalized Spatial Audio. Built for long listening sessions with comfort equal to the sound quality.</p>',
      },
    ],
  },
  {
    tag: 'accessories',
    title: 'Accessories',
    slug: 'accessories',
    productType: 'Accessory',
    description: 'Chargers, keyboards, mice and cases that complete your setup.',
    products: [
      {
        title: 'MagSafe Charger',
        vendor: 'Apple',
        price: 45,
        deviceKey: 'MagSafe Charger',
        color: '0',
        description:
          '<p>MagSafe Charger attaches magnetically to iPhone for perfectly aligned wireless charging up to 15W on compatible models. Connects via USB-C and works with MagSafe cases. A simple everyday essential for the desk or nightstand.</p>',
      },
      {
        title: 'Magic Keyboard with Touch ID USB-C Silver',
        vendor: 'Apple',
        price: 149,
        deviceKey: 'Magic Keyboard with Touch ID (USB-C)',
        color: 'Silver',
        description:
          '<p>Magic Keyboard with Touch ID (USB-C) pairs instantly with Mac and offers a full-size scissor-mechanism typing experience plus secure Touch ID unlock and Apple Pay. Rechargeable battery lasts about a month or more between charges.</p>',
      },
      {
        title: 'Magic Mouse USB-C White',
        vendor: 'Apple',
        price: 99,
        deviceKey: 'Magic Mouse (USB-C)',
        color: 'White',
        description:
          '<p>Magic Mouse (USB-C) features a Multi-Touch surface for gestures like swipe and scroll. Rechargeable design with USB-C charging and seamless pairing across your Mac. Finished in White.</p>',
      },
      {
        title: 'Magic Mouse USB-C Black',
        vendor: 'Apple',
        price: 99,
        deviceKey: 'Magic Mouse (USB-C)',
        color: 'Black',
        description:
          '<p>Magic Mouse (USB-C) in Black with Multi-Touch gestures, Bluetooth connectivity and a rechargeable battery. Smooth, precise tracking for everyday Mac navigation.</p>',
      },
      {
        title: 'iPhone 16 Silicone Case with MagSafe',
        vendor: 'Apple',
        price: 49,
        deviceKey: 'iPhone 16 Silicone Case with MagSafe',
        color: '0',
        description:
          '<p>Soft-touch silicone case designed for iPhone 16 with built-in magnets for MagSafe accessories and wireless charging. Protects the cameras and wraps snugly around the buttons for a precise fit.</p>',
      },
    ],
  },
]

export type DemoStoreSummary = {
  products: number
  collections: number
  menuItems: number
  pages: number
  heroSlides: number
}

/**
 * Demo AUD price for an NZD amount, ending in 9. Demo data only; real AUD
 * prices are entered by hand.
 */
function demoAudPrice(nzd: number): number {
  return Number((Math.ceil(nzd * 0.92 * 10) / 10 - 0.01).toFixed(2))
}

/**
 * Demo catalog for trying out the storefront: tech product types, vendors
 * and options, active products with appledb cover images (priced in NZD and
 * AUD), an About us page, Apple hero slides, and menu links. Lives outside
 * `database/seeders` so `db:seed` never runs it; run with
 * `node ace seed:demo-store` after `db:seed`. Safe to re-run: existing
 * records are skipped.
 */
export default class DemoStoreSeeder extends BaseSeeder {
  summary: DemoStoreSummary = {
    products: 0,
    collections: 0,
    menuItems: 0,
    pages: 0,
    heroSlides: 0,
  }

  async run() {
    await new CatalogDefaultSeeder(this.client).run()
    await new OptionDefinitionSeeder(this.client).run()

    const branding = await app.container.make(StorefrontBrandingService)
    await branding.setBrandName(DEMO_BRAND_NAME)

    const collections = await this.seedCollections()
    await this.seedProducts()
    const aboutPage = await this.seedAboutPage()
    await this.seedHeroSlides(collections)
    await this.seedMenu(collections, aboutPage?.id ?? null)
  }

  protected async seedCollections(): Promise<{ id: string; title: string; slug: string }[]> {
    const collectionService = await app.container.make(CollectionService)
    const inputs: (CreateCollectionInput & { slug: string })[] = CATEGORIES.map(
      ({ tag, title, slug, description }) => ({
        title,
        slug,
        type: 'automated' as const,
        status: 'active' as const,
        description: `<p>${description}</p>`,
        sortOrder: 'title_asc' as const,
        rules: [{ field: 'tag' as const, operator: 'equals' as const, value: tag }],
      })
    )

    const collections: { id: string; title: string; slug: string }[] = []
    for (const input of inputs) {
      const existing = await collectionService.findBySlug(input.slug)
      if (existing) {
        collections.push({ id: existing.id, title: existing.title, slug: existing.slug })
        continue
      }
      const collection = await collectionService.create(input)
      collections.push({ id: collection.id, title: collection.title, slug: collection.slug })
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
      CATEGORIES.flatMap(({ products }) => products.map(({ title }) => slugOf(title)))
    )

    const { default: Product } = await import('#models/product')
    const vendorIds = new Map<string, string>()
    for (const category of CATEGORIES) {
      const productType = await productTypeService.ensure(category.productType)

      for (const product of category.products) {
        const slug = slugOf(product.title)

        if (!vendorIds.has(product.vendor)) {
          const vendor = await vendorService.ensure(product.vendor)
          vendorIds.set(product.vendor, vendor.id)
        }

        if (taken.has(slug)) {
          const existing = await Product.findBy('slug', slug)
          if (existing && !existing.coverImage) {
            const coverImage = await importAppledbCover(
              product.deviceKey,
              product.color,
              product.title
            )
            if (coverImage) {
              existing.coverImage = coverImage
              await existing.save()
            }
          }
          continue
        }

        const coverImage = await importAppledbCover(product.deviceKey, product.color, product.title)

        await productService.create({
          title: product.title,
          description: product.description,
          status: 'active',
          productTypeId: productType.id,
          vendorId: vendorIds.get(product.vendor),
          tags: [category.tag, DEMO_TAG],
          price: product.price,
          coverImage: coverImage ?? undefined,
          marketPrices: aud
            ? [{ marketId: aud.id, price: demoAudPrice(product.price), compareAtPrice: null }]
            : undefined,
          options: [],
        })
        this.summary.products++
      }
    }
  }

  protected async seedAboutPage() {
    const pageRepository = await app.container.make(PageRepository)
    const existing = await pageRepository.findBySlug('about-us')
    if (existing) return existing

    const pageService = await app.container.make(PageService)
    const page = await pageService.create({
      title: 'About us',
      slug: 'about-us',
      status: 'active',
      seoTitle: 'About us | Akinai Gadgets',
      seoDescription:
        'Akinai Gadgets is a demo tech store showcasing phones, Macs, iPads and accessories.',
      body: `<p>Akinai Gadgets is a curated tech store for people who love Apple products and the accessories that make them better.</p>
<p>We stock the latest iPhone, Mac, iPad and AirPods models, plus everyday essentials like MagSafe chargers, Magic keyboards and protective cases. Every product listing is built to feel like a real storefront — clear specs, honest descriptions and photos that match what you are buying.</p>
<p>This storefront is demo data for Akinai. Explore collections, add items to your cart and try checkout flows end to end.</p>`,
    })
    this.summary.pages++
    return page
  }

  protected async seedHeroSlides(collections: { id: string; title: string; slug: string }[]) {
    const { default: StorefrontHeroSlideRepository } =
      await import('../../plugins/hero_slideshow/server/repositories/storefront_hero_slide_repository.js')
    const { HERO_IMAGE_FOLDER } = await import('../../plugins/hero_slideshow/server/constants.js')
    const { default: StorefrontHeroSlideService } =
      await import('../../plugins/hero_slideshow/server/services/storefront_hero_slide_service.js')

    const repository = new StorefrontHeroSlideRepository()
    const service = new StorefrontHeroSlideService(repository)
    const existing = await repository.list()
    const byHeading = new Map(existing.map((slide) => [slide.heading, slide]))

    const iphone = collections.find((c) => c.slug === 'iphone')
    const mac = collections.find((c) => c.slug === 'mac')

    const slides: {
      heading: string
      subheading: string
      buttonLabel: string
      eyebrow: string
      collectionId: string | null
      deviceKey: string
      color: string
    }[] = [
      {
        eyebrow: 'New',
        heading: 'iPhone 16 Pro',
        subheading: 'Desert Titanium. A18 Pro. Camera Control.',
        buttonLabel: 'Shop iPhone',
        collectionId: iphone?.id ?? null,
        deviceKey: 'iPhone17,1',
        color: 'Desert Titanium',
      },
      {
        eyebrow: 'Mac',
        heading: 'MacBook Air 15-inch',
        subheading: 'Supercharged by M3. Impossibly thin.',
        buttonLabel: 'Shop Mac',
        collectionId: mac?.id ?? null,
        deviceKey: 'Mac15,3',
        color: 'Space Gray',
      },
    ]

    for (const slide of slides) {
      let row = byHeading.get(slide.heading) ?? null
      if (!row) {
        row = await service.create({
          eyebrow: slide.eyebrow,
          heading: slide.heading,
          subheading: slide.subheading,
          buttonLabel: slide.buttonLabel,
          type: slide.collectionId ? 'collection' : 'url',
          collectionId: slide.collectionId,
          url: slide.collectionId ? null : '/',
          isVisible: true,
        })
        this.summary.heroSlides++
      }

      if (!row.image) {
        const imageKey = await uploadAppledbToFolder(
          HERO_IMAGE_FOLDER,
          slide.deviceKey,
          slide.color,
          slide.heading
        )
        if (imageKey) {
          await repository.update(row, { image: imageKey })
        }
      }
    }
  }

  protected async seedMenu(
    collections: { id: string; title: string }[],
    aboutPageId: string | null
  ) {
    const menuService = await app.container.make(StorefrontMenuService)
    const items = await menuService.list()
    const linkedCollections = new Set(items.map((item) => item.collectionId).filter(Boolean))
    const linkedPages = new Set(items.map((item) => item.pageId).filter(Boolean))
    let count = items.length

    if (!items.some((item) => item.type === 'url' && item.url === '/')) {
      if (count >= MAX_MENU_ITEMS) return
      await menuService.create({ label: 'Home', type: 'url', url: '/' })
      this.summary.menuItems++
      count++
    }

    for (const { id, title } of collections) {
      if (linkedCollections.has(id) || count >= MAX_MENU_ITEMS) continue
      await menuService.create({ label: title, type: 'collection', collectionId: id })
      this.summary.menuItems++
      count++
    }

    if (aboutPageId && !linkedPages.has(aboutPageId) && count < MAX_MENU_ITEMS) {
      await menuService.create({ label: 'About us', type: 'page', pageId: aboutPageId })
      this.summary.menuItems++
    }
  }
}
