import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ArrowRight, Leaf } from 'lucide-react'
import { urlFor } from '~/client'
import StorefrontLayout from '~/layouts/storefront'
import {
  CardSlider,
  CardSliderSkeleton,
  FeatureTiles,
  FeatureTilesSkeleton,
  ImagePlaceholder,
  PromoBanner,
  PromoBannerSkeleton,
  SectionHeader,
  Testimonials,
  TestimonialsSkeleton,
  type FeatureTile,
} from '~/components/storefront'
import { Skeleton } from '~/components/ui'
import { collectionRailId } from '~/lib/collection_link'
import type { MoneyFormat } from '~/lib/money'
import { cn, storefront } from '~/lib/styles'
import { PluginSlot } from '~/plugins'
import { HeroSliderSkeleton } from '~/plugins/hero_slideshow/hero_slider'
import {
  useStoreMoney,
  useStorefrontHome,
  useStorefrontHomeContent,
  useStorefrontTheme,
} from './_hooks'
import ProductGrid, { ProductGridSkeleton } from './_product_grid'
import type {
  StorefrontHomeCollection,
  StorefrontPrefetchProps,
  StorefrontPromoBanner,
} from './_types'

/**
 * Shown when staff have not set up feature highlights. Kept generic so
 * they hold true for any store.
 */
const DEFAULT_FEATURES: FeatureTile[] = [
  {
    id: 'secure-checkout',
    icon: 'shield-check',
    title: 'Secure checkout',
    text: 'Your payment details stay protected',
  },
  {
    id: 'delivery',
    icon: 'truck',
    title: 'Delivered to your door',
    text: 'Order online and we bring it to you',
  },
  {
    id: 'support',
    icon: 'headphones',
    title: 'Friendly support',
    text: 'Questions about an order? We are here to help',
    href: urlFor('storefront.help.home'),
  },
]

function PromoBanners({
  banners,
  className,
}: {
  banners: StorefrontPromoBanner[]
  className?: string
}) {
  if (banners.length === 0) return null
  return (
    <div
      className={cn('grid grid-cols-1 gap-4', banners.length > 1 && 'md:grid-cols-2', className)}
    >
      {banners.map((banner) => (
        <PromoBanner
          key={banner.id}
          eyebrow={banner.eyebrow}
          title={banner.title}
          buttonLabel={banner.buttonLabel}
          href={banner.href}
          isExternal={banner.isExternal}
          imageUrl={banner.imageUrl}
          tone={banner.tone}
        />
      ))}
    </div>
  )
}

function ProductRail({
  collection,
  money,
}: {
  collection: StorefrontHomeCollection
  money: MoneyFormat
}) {
  const railId = collectionRailId(collection.slug)

  return (
    <section
      id={railId}
      className={cn(storefront.section, 'scroll-mt-36')}
      aria-labelledby={`${railId}-title`}
    >
      <SectionHeader
        id={`${railId}-title`}
        title={collection.title}
        action={
          <Link
            route="storefront.collections.show"
            routeParams={{ slug: collection.slug }}
            className="inline-flex items-center gap-1 rounded-md text-[14px] font-medium text-sf-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            aria-label={`View all ${collection.title}`}
          >
            View all <ArrowRight size={15} />
          </Link>
        }
      />
      <ProductGrid products={collection.products} money={money} collectionSlug={collection.slug} />
    </section>
  )
}

/**
 * Shown when no hero slide is set up in the back office, or slides fail
 * to load.
 */
function StaticHero({ href }: { href: string }) {
  return (
    <section className="mt-5 grid grid-cols-1 overflow-hidden rounded-card bg-sf-primary text-sf-primary-fg sm:mt-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col justify-center gap-4 p-6 sm:p-10">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sf-primary-fg/10 px-3 py-1 text-[12.5px] font-medium">
          <Leaf size={14} className="text-sf-accent" /> 100% fresh, every day
        </span>
        <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-[42px]">
          Fresh groceries delivered to your door
        </h1>
        <p className="max-w-md text-[15px] opacity-85">
          Shop seasonal produce, pantry staples and everyday essentials, picked and packed with
          care.
        </p>
        <a href={href} className={cn(storefront.accentButton, 'w-fit')}>
          Shop now <ArrowRight size={15} />
        </a>
      </div>
      <ImagePlaceholder className="min-h-[200px] md:min-h-[340px]" iconSize={36} />
    </section>
  )
}

function PromoBannersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)} aria-hidden="true">
      <PromoBannerSkeleton />
      <PromoBannerSkeleton className="max-md:hidden" />
    </div>
  )
}

function BrandsSkeleton() {
  return (
    <section className={storefront.section} aria-hidden="true">
      <Skeleton className="mb-4 h-6 w-40 sm:mb-5" />
      <CardSliderSkeleton />
    </section>
  )
}

function RailSkeleton() {
  return (
    <section className={storefront.section} aria-hidden="true">
      <Skeleton className="mb-5 h-6 w-48" />
      <ProductGridSkeleton count={4} />
    </section>
  )
}

export default function Home(_props: StorefrontPrefetchProps) {
  const { data: home, isLoading, isError, refetch } = useStorefrontHome()
  const { data: theme } = useStorefrontTheme()
  const { data: content, isLoading: contentLoading } = useStorefrontHomeContent()
  const money = useStoreMoney()
  const features = content && content.features.length > 0 ? content.features : DEFAULT_FEATURES
  const collections = home?.collections ?? []
  const [first, ...rest] = collections
  const firstHref = first ? `#${collectionRailId(first.slug)}` : '#'

  return (
    <>
      <Head title={theme?.footerTagline ?? ''} />
      <div className={storefront.container}>
        <PluginSlot
          name="home.hero"
          fallback={<StaticHero href={firstHref} />}
          loading={<HeroSliderSkeleton />}
        />

        {isLoading && <RailSkeleton />}

        {isError && (
          <div className={cn(storefront.card, storefront.section, 'p-8 text-center')}>
            <p className="text-[15px] font-medium">We could not load the products right now.</p>
            <button
              type="button"
              className={cn(storefront.primaryButton, 'mt-4')}
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        )}

        {home && collections.length === 0 && (
          <div className={cn(storefront.card, storefront.section, 'p-8 text-center')}>
            <p className="text-[16px] font-semibold">Products are on their way</p>
            <p className="mt-1 text-[14px] text-sf-muted">
              Check back soon for fresh picks and weekly deals.
            </p>
          </div>
        )}

        {first && <ProductRail collection={first} money={money} />}

        <PluginSlot name="home.after_first_rail" />

        {contentLoading ? (
          <PromoBannersSkeleton className={storefront.section} />
        ) : (
          content && <PromoBanners banners={content.middleBanners} className={storefront.section} />
        )}

        {isLoading && <RailSkeleton />}

        {rest.slice(0, 2).map((collection) => (
          <ProductRail key={collection.id} collection={collection} money={money} />
        ))}

        {isLoading && <BrandsSkeleton />}

        {home && home.vendors.length > 0 && (
          <section className={storefront.section} aria-labelledby="brands-title">
            <SectionHeader id="brands-title" title="Shop by brands" />
            <CardSlider
              label="Shop by brands"
              itemsLabel="brands"
              items={home.vendors.map((vendor) => ({
                id: vendor.id,
                label: vendor.name,
                imageUrl: vendor.imageUrl,
              }))}
            />
          </section>
        )}

        {contentLoading ? (
          <FeatureTilesSkeleton className={storefront.section} />
        ) : (
          <FeatureTiles items={features} className={storefront.section} />
        )}

        {rest.slice(2).map((collection) => (
          <ProductRail key={collection.id} collection={collection} money={money} />
        ))}

        {contentLoading ? (
          <TestimonialsSkeleton className={storefront.section} />
        ) : (
          content &&
          content.testimonials.length > 0 && (
            <Testimonials items={content.testimonials} className={storefront.section} />
          )
        )}

        {content && <PromoBanners banners={content.bottomBanners} className={storefront.section} />}

        <PluginSlot name="home.footer" />
      </div>
    </>
  )
}

Home.layout = [StorefrontLayout]
