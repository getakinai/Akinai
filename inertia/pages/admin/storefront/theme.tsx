import { ExternalLink } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { PROMO_PLACEMENTS } from '~/lib/storefront'
import { buttonClasses, card } from '~/lib/styles'
import HeroSlidesCard from '@plugins/hero_slideshow/client/pages/admin/_hero_slides_card'
import { useCan } from '../_hooks'
import { useAdminNavPlugins } from '../plugins/_hooks'
import LiveThemeNotice from '../themes/_live_theme_notice'
import BrandingCard from './_branding_card'
import ContentTextsCard from './_content_texts_card'
import FeaturedReviewsCard from './_featured_reviews_card'
import FeaturesCard from './_features_card'
import { useAdminStorefrontPromoBanners, useAdminStorefrontTheme } from './_hooks'
import PromoBannersCard from './_promo_banners_card'
import ThemeForm from './_theme_form'
import { type AdminStorefrontTheme } from './_types'

/** Changes only when the colors change, so a logo upload keeps unsaved colors. */
function themeFormKey(theme: AdminStorefrontTheme) {
  return [
    theme.primaryColor,
    theme.primaryForegroundColor,
    theme.accentColor,
    theme.backgroundColor,
    theme.surfaceColor,
    theme.textColor,
  ].join('|')
}

export default function StorefrontThemePage() {
  const { data: theme, isLoading, isError, refetch } = useAdminStorefrontTheme()
  const canEdit = useCan('storefront.edit')
  const banners = useAdminStorefrontPromoBanners()
  const navPlugins = useAdminNavPlugins()
  const heroEnabled = navPlugins?.some((plugin) => plugin.key === 'hero_slideshow') ?? false

  return (
    <Page
      title="Built-in theme"
      description="Set the logo, favicon, colors, hero, announcement, promo banners, highlights and testimonials of the built-in theme. Uploaded themes have their own settings."
      actions={
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          View storefront <ExternalLink size={14} />
        </a>
      }
    >
      <LiveThemeNotice />

      {isLoading && (
        <div className={card.base}>
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className={card.base}>
          <p className="text-[14px] text-muted">The theme could not be loaded.</p>
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Try again
          </FormButton>
        </div>
      )}

      {theme && (
        <div className="flex min-w-0 flex-col gap-6">
          <BrandingCard theme={theme} />
          <ThemeForm key={themeFormKey(theme)} theme={theme} disabled={!canEdit} />
          {heroEnabled && <HeroSlidesCard />}
          <ContentTextsCard editable={canEdit} />
          {PROMO_PLACEMENTS.map((placement) => (
            <PromoBannersCard
              key={placement}
              placement={placement}
              banners={banners.data?.filter((banner) => banner.placement === placement)}
              isLoading={banners.isLoading}
              isError={banners.isError}
              onRetry={() => banners.refetch()}
            />
          ))}
          <FeaturesCard editable={canEdit} />
          <FeaturedReviewsCard />
        </div>
      )}
    </Page>
  )
}

StorefrontThemePage.layout = [AdminLayout]
