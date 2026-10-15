import { inject } from '@adonisjs/core'
import type Market from '#models/market'
import type Product from '#models/product'
import type StorefrontTheme from '#models/storefront_theme'
import PageRepository from '#repositories/page_repository'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'
import StoreSettingService from '#services/store_setting_service'
import StorefrontThemeService from '#services/storefront_theme_service'
import { absoluteUrl } from '#utils/app_url'
import { extraNumber } from '#utils/extra_number'
import { imageUrl } from '#utils/image_url'
import { serializeJsonLd } from '#utils/json_ld'
import { plainText } from '#utils/plain_text'
import { productImageUrls } from '#utils/product_image_urls'

/** Search engines show about this many characters of a description. */
export const META_DESCRIPTION_LENGTH = 160

/**
 * Head tags for a storefront page, rendered server-side by
 * `inertia_layout.edge` so crawlers and link previews see them without
 * running JavaScript. Plain values only, never a model.
 */
export type SeoMeta = {
  title: string
  description: string | null
  canonicalUrl: string
  type: 'website' | 'product'
  image: string | null
  siteName: string
  /** Already escaped by `serializeJsonLd`; printed raw. */
  jsonLd: string | null
}

/** A record with an editable search listing. */
type SeoSource = { title: string; seoTitle: string | null; seoDescription: string | null }

type Brand = { siteName: string; theme: StorefrontTheme }

const absoluteImage = (key: string | null) => (key ? absoluteUrl(imageUrl(key)) : null)

@inject()
export default class StorefrontSeoService {
  constructor(
    protected storefrontCatalogRepository: StorefrontCatalogRepository,
    protected pageRepository: PageRepository,
    protected storeSettingService: StoreSettingService,
    protected storefrontThemeService: StorefrontThemeService
  ) {}

  async forHome(): Promise<SeoMeta> {
    const { siteName, theme } = await this.brand()
    const url = absoluteUrl('/')
    return {
      title: siteName,
      description: theme.footerTagline,
      canonicalUrl: url,
      type: 'website',
      image: absoluteImage(theme.logoImage),
      siteName,
      jsonLd: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': siteName,
        url,
      }),
    }
  }

  async forProduct(slug: string, market: Market): Promise<SeoMeta | null> {
    const [product, { siteName }] = await Promise.all([
      this.storefrontCatalogRepository.findActiveProductSeoBySlug(slug, market),
      this.brand(),
    ])
    if (!product) return null

    const images = productImageUrls(product).map(absoluteUrl)

    const meta = this.meta(product, product.description, `/products/${product.slug}`, siteName, {
      type: 'product',
      image: images[0] ?? null,
    })
    return { ...meta, jsonLd: serializeJsonLd(this.productJsonLd(product, market, meta, images)) }
  }

  async forCollection(slug: string): Promise<SeoMeta | null> {
    const [collection, { siteName }] = await Promise.all([
      this.storefrontCatalogRepository.findActiveCollectionSeoBySlug(slug),
      this.brand(),
    ])
    if (!collection) return null

    return this.meta(
      collection,
      collection.description,
      `/collections/${collection.slug}`,
      siteName,
      { image: absoluteImage(collection.image) }
    )
  }

  async forPage(slug: string): Promise<SeoMeta | null> {
    const [page, { siteName }] = await Promise.all([
      this.pageRepository.findActiveBySlug(slug),
      this.brand(),
    ])
    if (!page) return null

    return this.meta(page, page.body, `/pages/${page.slug}`, siteName)
  }

  /** Store settings and theme are each one row; load both together, once. */
  protected async brand(): Promise<Brand> {
    const [settings, theme] = await Promise.all([
      this.storeSettingService.get(),
      this.storefrontThemeService.get(),
    ])
    return { siteName: theme.brandName || settings.storeName, theme }
  }

  /** Overrides win; otherwise the record title and its rich-text `body` as plain text. */
  protected meta(
    source: SeoSource,
    body: string | null,
    path: string,
    siteName: string,
    extra: Partial<Pick<SeoMeta, 'type' | 'image'>> = {}
  ): SeoMeta {
    return {
      title: source.seoTitle ?? source.title,
      description: source.seoDescription ?? plainText(body, META_DESCRIPTION_LENGTH),
      canonicalUrl: absoluteUrl(path),
      type: extra.type ?? 'website',
      image: extra.image ?? null,
      siteName,
      jsonLd: null,
    }
  }

  /**
   * schema.org Product. Offers are left out when no variant has a price in
   * the market; the rating only when the product has visible reviews.
   */
  protected productJsonLd(
    product: Product,
    market: Market,
    meta: SeoMeta,
    images: string[]
  ): Record<string, unknown> {
    const { $extras } = product
    const priceMin = extraNumber($extras.price_min)
    const priceMax = extraNumber($extras.price_max)
    const ratingCount = extraNumber($extras.rating_count) ?? 0
    const ratingAvg = extraNumber($extras.rating_avg)

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.title,
      'url': meta.canonicalUrl,
      ...(meta.description !== null && { description: meta.description }),
      ...(images.length > 0 && { image: images }),
      ...(!!product.vendor && {
        brand: { '@type': 'Brand', 'name': product.vendor.name },
      }),
      ...(priceMin !== null && {
        offers: {
          '@type': 'AggregateOffer',
          'priceCurrency': market.currencyCode,
          'lowPrice': priceMin.toFixed(2),
          'highPrice': (priceMax ?? priceMin).toFixed(2),
          'availability': $extras.in_stock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          'url': meta.canonicalUrl,
        },
      }),
      ...(ratingCount > 0 &&
        ratingAvg !== null && {
          aggregateRating: {
            '@type': 'AggregateRating',
            'ratingValue': Math.round(ratingAvg * 10) / 10,
            'reviewCount': ratingCount,
          },
        }),
    }
  }
}
