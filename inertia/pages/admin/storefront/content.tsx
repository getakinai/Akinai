import { ExternalLink } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import { PROMO_PLACEMENTS } from '~/lib/storefront'
import { buttonClasses } from '~/lib/styles'
import { useCan } from '../_hooks'
import LiveThemeNotice from '../themes/_live_theme_notice'
import ContentTextsCard from './_content_texts_card'
import FeaturedReviewsCard from './_featured_reviews_card'
import FeaturesCard from './_features_card'
import { useAdminStorefrontPromoBanners } from './_hooks'
import PromoBannersCard from './_promo_banners_card'

export default function StorefrontContentPage() {
  const canEdit = useCan('storefront.edit')
  const banners = useAdminStorefrontPromoBanners()

  return (
    <Page
      title="Built-in theme content"
      description="Set the announcement, promo banners, highlights and testimonials of the built-in theme. Uploaded themes have their own settings."
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
      <div className="flex min-w-0 flex-col gap-5">
        <LiveThemeNotice />
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
    </Page>
  )
}

StorefrontContentPage.layout = [AdminLayout]
