import { Link } from '@adonisjs/inertia/react'
import { ChevronRight, Mail, MessageCircleQuestion, Phone } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import { cn, storefront } from '~/lib/styles'
import { useStoreSettings } from '../_hooks'
import type { HelpArticleSummary } from './_types'

const crumbLink = 'truncate hover:text-sf-text hover:underline'

function Separator() {
  return <ChevronRight size={14} aria-hidden="true" className="flex-none" />
}

/**
 * Home › Help › Category › Article. Leave out `current` on the help home;
 * pass `category` on article pages so it links back to the category.
 */
export function HelpBreadcrumb({
  category,
  current,
}: {
  category?: { slug: string; title: string }
  current?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className="mt-5 sm:mt-7">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-sf-muted">
        <li>
          <Link route="home" className={crumbLink}>
            Home
          </Link>
        </li>
        <li className="flex min-w-0 items-center gap-1">
          <Separator />
          {current ? (
            <Link route="storefront.help.home" className={crumbLink}>
              Help
            </Link>
          ) : (
            <span className="text-sf-text" aria-current="page">
              Help
            </span>
          )}
        </li>
        {category && (
          <li className="flex min-w-0 items-center gap-1">
            <Separator />
            <Link
              route="storefront.help.categories.show"
              routeParams={{ category: category.slug }}
              className={crumbLink}
            >
              {category.title}
            </Link>
          </li>
        )}
        {current && (
          <li className="flex min-w-0 items-center gap-1">
            <Separator />
            <span className="truncate text-sf-text" aria-current="page">
              {current}
            </span>
          </li>
        )}
      </ol>
    </nav>
  )
}

export function HelpArticleLink({ article, meta }: { article: HelpArticleSummary; meta?: string }) {
  return (
    <Link
      route="storefront.help.articles.show"
      routeParams={{ category: article.categorySlug, slug: article.slug }}
      className="group flex min-w-0 items-start justify-between gap-3 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="min-w-0">
        {meta && <span className="block text-[12px] text-sf-muted">{meta}</span>}
        <span className="block text-[14.5px] font-medium break-words text-sf-text group-hover:text-sf-primary">
          {article.title}
        </span>
        <span className="mt-0.5 block text-[13px] break-words text-sf-muted">
          {article.description}
        </span>
      </span>
      <ChevronRight
        size={16}
        aria-hidden="true"
        className="mt-1 flex-none text-sf-muted group-hover:text-sf-primary"
      />
    </Link>
  )
}

export function HelpArticleListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 p-3" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

export function HelpLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
      <p className="text-[15px] font-semibold">{message}</p>
      <button type="button" className={cn(storefront.primaryButton, 'mt-4')} onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function HelpNotFound({ title }: { title: string }) {
  return (
    <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
      <p className="text-[16px] font-semibold">{title}</p>
      <p className="mt-1 text-[14px] text-sf-muted">It may have been moved or renamed.</p>
      <Link route="storefront.help.home" className={cn(storefront.primaryButton, 'mt-4')}>
        Back to Help
      </Link>
    </div>
  )
}

/** Store contact details from settings, for questions the articles don't answer. */
export function HelpContactCard({ className }: { className?: string }) {
  const { data: settings, isLoading } = useStoreSettings()
  const hasContact = Boolean(settings?.contactEmail || settings?.phone)

  return (
    <section
      aria-labelledby="help-contact-title"
      className={cn(
        storefront.card,
        'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
          <MessageCircleQuestion size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="help-contact-title" className="text-[16px] font-semibold text-sf-text">
            Still need help?
          </h2>
          <p className="mt-0.5 text-[13.5px] text-sf-muted">
            Contact us and include your order number if your question is about an order.
          </p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-48 max-w-full" />
      ) : hasContact ? (
        <ul className="flex min-w-0 flex-col gap-2 text-[14px] sm:items-end">
          {settings?.contactEmail && (
            <li className="flex min-w-0 items-center gap-2">
              <Mail size={15} aria-hidden="true" className="flex-none text-sf-muted" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="truncate font-medium text-sf-primary hover:underline"
              >
                {settings.contactEmail}
              </a>
            </li>
          )}
          {settings?.phone && (
            <li className="flex items-center gap-2">
              <Phone size={15} aria-hidden="true" className="flex-none text-sf-muted" />
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                className="font-medium text-sf-primary hover:underline"
              >
                {settings.phone}
              </a>
            </li>
          )}
        </ul>
      ) : null}
    </section>
  )
}
