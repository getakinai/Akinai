import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import { buttonClasses } from '~/lib/styles'
import HeroSlidesCard from './_hero_slides_card'

export default function StorefrontHeroPage() {
  return (
    <Page
      eyebrow={
        <Link route="admin.plugins.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Plugins
        </Link>
      }
      title="Storefront hero"
      description="Choose the slides that rotate at the top of the storefront home page. When none are shown, the storefront uses the default hero."
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
      <HeroSlidesCard />
    </Page>
  )
}

StorefrontHeroPage.layout = [AdminLayout]
