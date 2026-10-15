import { Newspaper } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import type { PluginClientEntry } from '~/plugins/types'
import NewsletterForm from './newsletter_form'

/** The band at the top of the storefront footer. */
function NewsletterFooterBand() {
  return (
    <div className="border-b border-sf-primary-fg/15">
      <div className={cn(storefront.container, 'py-8')}>
        <NewsletterForm />
      </div>
    </div>
  )
}

export default {
  slot: 'layout.footer' as const,
  Component: NewsletterFooterBand,
  navIcon: Newspaper,
} satisfies PluginClientEntry
