import { z } from 'zod'
import { ProductLabelBadgeSchema } from '~/lib/product_label'
import { cursorPaginatedResponse } from '~/lib/schemas'
import { CURRENCY_DISPLAYS, DATE_FORMATS, UNIT_SYSTEMS, WEIGHT_UNITS } from '~/lib/store_settings'
import { FEATURE_ICONS, PROMO_TONES, THEME_PRESET_KEYS } from '~/lib/storefront'

export const StoreSettingsSchema = z.object({
  storeName: z.string(),
  legalName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  phone: z.string().nullable(),
  storeAddressLine1: z.string().nullable(),
  storeSuburb: z.string().nullable(),
  storeCity: z.string().nullable(),
  storeRegion: z.string().nullable(),
  storePostalCode: z.string().nullable(),
  storeCountryCode: z.string().nullable(),
  operatingCountryCode: z.string().nullable(),
  currencyCode: z.string(),
  currencyDisplay: z.enum(CURRENCY_DISPLAYS),
  locale: z.string(),
  dateFormat: z.enum(DATE_FORMATS),
  timezone: z.string(),
  unitSystem: z.enum(UNIT_SYSTEMS),
  weightUnit: z.enum(WEIGHT_UNITS),
  checkoutDeliveryHeading: z.string().nullable(),
  checkoutDeliveryNote: z.string().nullable(),
})

export type StoreSettings = z.infer<typeof StoreSettingsSchema>

export const StoreSettingsResponseSchema = z.object({ data: StoreSettingsSchema })

export const StorefrontThemeSchema = z.object({
  preset: z.enum(THEME_PRESET_KEYS),
  primaryColor: z.string(),
  primaryForegroundColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  brandName: z.string().nullable(),
  logoUrl: z.string().nullable(),
  announcementText: z.string().nullable(),
  announcementUrl: z.string().nullable(),
  footerTagline: z.string().nullable(),
})

export type StorefrontTheme = z.infer<typeof StorefrontThemeSchema>

export const StorefrontThemeResponseSchema = z.object({ data: StorefrontThemeSchema })

export const StorefrontMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  collectionSlug: z.string().nullable(),
  isExternal: z.boolean(),
})

export type StorefrontMenuItem = z.infer<typeof StorefrontMenuItemSchema>

export const StorefrontMenuResponseSchema = z.object({ data: z.array(StorefrontMenuItemSchema) })

export const StorefrontHeroSlideSchema = z.object({
  id: z.string(),
  eyebrow: z.string().nullable(),
  heading: z.string(),
  subheading: z.string().nullable(),
  buttonLabel: z.string().nullable(),
  imageUrl: z.string().nullable(),
  href: z.string(),
  isExternal: z.boolean(),
})

export type StorefrontHeroSlide = z.infer<typeof StorefrontHeroSlideSchema>

export const StorefrontHeroSlidesResponseSchema = z.object({
  data: z.array(StorefrontHeroSlideSchema),
})

export const StorefrontPromoBannerSchema = z.object({
  id: z.string(),
  eyebrow: z.string().nullable(),
  title: z.string(),
  buttonLabel: z.string().nullable(),
  tone: z.enum(PROMO_TONES),
  imageUrl: z.string().nullable(),
  href: z.string(),
  isExternal: z.boolean(),
})

export type StorefrontPromoBanner = z.infer<typeof StorefrontPromoBannerSchema>

export const StorefrontFeatureSchema = z.object({
  id: z.string(),
  icon: z.enum(FEATURE_ICONS),
  title: z.string(),
  text: z.string(),
})

export type StorefrontFeature = z.infer<typeof StorefrontFeatureSchema>

export const StorefrontTestimonialSchema = z.object({
  id: z.string(),
  rating: z.number().int(),
  title: z.string().nullable(),
  body: z.string(),
  authorName: z.string(),
  product: z.object({ title: z.string(), slug: z.string() }).nullable(),
})

export type StorefrontTestimonial = z.infer<typeof StorefrontTestimonialSchema>

export const StorefrontHomeContentResponseSchema = z.object({
  data: z.object({
    middleBanners: z.array(StorefrontPromoBannerSchema),
    bottomBanners: z.array(StorefrontPromoBannerSchema),
    features: z.array(StorefrontFeatureSchema),
    testimonials: z.array(StorefrontTestimonialSchema),
  }),
})

export const StorefrontProductCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  variantId: z.string().nullable(),
  vendor: z.string().nullable(),
  category: z.string().nullable(),
  label: ProductLabelBadgeSchema.nullable(),
  price: z.number().nullable(),
  compareAtPrice: z.number().nullable(),
})

export type StorefrontProductCard = z.infer<typeof StorefrontProductCardSchema>

export const StorefrontSearchResponseSchema = z.object({
  data: z.array(StorefrontProductCardSchema),
})

export const StorefrontHomeCollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  products: z.array(StorefrontProductCardSchema),
})

export type StorefrontHomeCollection = z.infer<typeof StorefrontHomeCollectionSchema>

export const StorefrontHomeSchema = z.object({
  collections: z.array(StorefrontHomeCollectionSchema),
  vendors: z.array(z.object({ id: z.string(), name: z.string(), imageUrl: z.string().nullable() })),
})

export type StorefrontHome = z.infer<typeof StorefrontHomeSchema>

export const StorefrontHomeResponseSchema = z.object({ data: StorefrontHomeSchema })

export const StorefrontCollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
})

export type StorefrontCollection = z.infer<typeof StorefrontCollectionSchema>

export const StorefrontCollectionResponseSchema = z.object({ data: StorefrontCollectionSchema })

export const StorefrontPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  body: z.string().nullable(),
})

export type StorefrontPage = z.infer<typeof StorefrontPageSchema>

export const StorefrontPageResponseSchema = z.object({ data: StorefrontPageSchema })

export const StorefrontPolicySchema = z.object({
  policyType: z.enum(['refund', 'shipping', 'privacy', 'terms']),
  title: z.string(),
  href: z.string(),
})

export type StorefrontPolicy = z.infer<typeof StorefrontPolicySchema>

export const StorefrontPoliciesResponseSchema = z.object({ data: z.array(StorefrontPolicySchema) })

export const StorefrontCollectionProductsResponseSchema = cursorPaginatedResponse(
  StorefrontProductCardSchema
)

const StorefrontFacetEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
})

export type StorefrontFacetEntry = z.infer<typeof StorefrontFacetEntrySchema>

export const StorefrontCollectionFacetsSchema = z.object({
  price: z.object({ min: z.number().nullable(), max: z.number().nullable() }),
  vendors: z.array(StorefrontFacetEntrySchema),
  productTypes: z.array(StorefrontFacetEntrySchema),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
})

export type StorefrontCollectionFacets = z.infer<typeof StorefrontCollectionFacetsSchema>

export const StorefrontCollectionFiltersResponseSchema = z.object({
  data: StorefrontCollectionFacetsSchema,
})

/** Filters the shopper picked on a collection page. Option keys are option names. */
export const CollectionFiltersSchema = z.object({
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  vendor: z.array(z.string()),
  type: z.array(z.string()),
  options: z.record(z.string(), z.array(z.string())),
  inStock: z.boolean(),
})

export type CollectionFilters = z.infer<typeof CollectionFiltersSchema>

export const StorefrontProductVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().nullable(),
  compareAtPrice: z.number().nullable(),
  optionValues: z.array(z.string().nullable()),
})

export type StorefrontProductVariant = z.infer<typeof StorefrontProductVariantSchema>

export const StorefrontProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  vendor: z.string().nullable(),
  category: z.string().nullable(),
  label: ProductLabelBadgeSchema.nullable(),
  description: z.string().nullable(),
  images: z.array(z.string()),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
  variants: z.array(StorefrontProductVariantSchema),
})

export type StorefrontProduct = z.infer<typeof StorefrontProductSchema>

export const StorefrontProductResponseSchema = z.object({ data: StorefrontProductSchema })

export const StorefrontSessionSchema = z.object({
  signedIn: z.boolean(),
  maintenance: z.boolean(),
  impersonation: z.object({ customerName: z.string() }).nullable(),
})

export type StorefrontSession = z.infer<typeof StorefrontSessionSchema>

export const StorefrontSessionResponseSchema = z.object({ data: StorefrontSessionSchema })

export const StorefrontMarketSummarySchema = z.object({
  handle: z.string(),
  name: z.string(),
  currencyCode: z.string(),
  countryCode: z.string().nullable(),
})

export type StorefrontMarketSummary = z.infer<typeof StorefrontMarketSummarySchema>

export const StorefrontMarketSchema = z.object({
  current: StorefrontMarketSummarySchema.extend({
    pricesIncludeTax: z.boolean(),
    taxName: z.string().nullable(),
  }),
  markets: z.array(StorefrontMarketSummarySchema),
  shippingCountryCodes: z.array(z.string()),
})

export type StorefrontMarket = z.infer<typeof StorefrontMarketSchema>

export const StorefrontMarketResponseSchema = z.object({ data: StorefrontMarketSchema })

/**
 * The `prefetch` prop of server-rendered storefront pages (home, product,
 * collection, content page): the same payloads as their JSON routes, so the
 * first render already has headings, products and links. `null` on Inertia
 * visits, which fetch through the JSON routes instead.
 */
export const StorefrontPrefetchSchema = z.object({
  settings: StoreSettingsSchema,
  theme: StorefrontThemeSchema,
  menu: z.array(StorefrontMenuItemSchema),
  policies: z.array(StorefrontPolicySchema),
  market: StorefrontMarketSchema,
  home: StorefrontHomeSchema.optional(),
  heroSlides: z.array(StorefrontHeroSlideSchema).optional(),
  homeContent: StorefrontHomeContentResponseSchema.shape.data.optional(),
  product: StorefrontProductSchema.nullable().optional(),
  collection: StorefrontCollectionSchema.nullable().optional(),
  collectionProducts: StorefrontCollectionProductsResponseSchema.nullable().optional(),
  page: StorefrontPageSchema.nullable().optional(),
})

export type StorefrontPrefetch = z.infer<typeof StorefrontPrefetchSchema>

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** Read and validated once by `seedStorefrontQueries()`, not by the page. */
export type StorefrontPrefetchProps = { prefetch?: { [key: string]: Json } | null }

export const StorefrontMarketUpdateSchema = z.object({ handle: z.string().min(1) })

export type StorefrontMarketUpdate = z.infer<typeof StorefrontMarketUpdateSchema>

export const StorefrontCartPricesSchema = z.object({
  market: z.string(),
  prices: z.array(
    z.object({
      variantId: z.string(),
      price: z.number(),
      compareAtPrice: z.number().nullable(),
    })
  ),
})

export type StorefrontCartPrices = z.infer<typeof StorefrontCartPricesSchema>

export const StorefrontCartPricesResponseSchema = z.object({ data: StorefrontCartPricesSchema })

export const StoredCartSchema = z.array(
  z.object({
    product: z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      price: z.number().nonnegative(),
      imageUrl: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    quantity: z.number().int().positive(),
  })
)

export type StoredCart = z.infer<typeof StoredCartSchema>

export const NewsletterFormSchema = z.object({
  email: z.email('Enter a valid email address').trim().max(254),
})

export type NewsletterForm = z.infer<typeof NewsletterFormSchema>

export const NewsletterResponseSchema = z.object({
  data: z.object({ subscribed: z.boolean() }),
})
