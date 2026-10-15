import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import StorefrontLayout from '~/layouts/storefront'
import { HttpError } from '~/lib/http'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { cn, storefront } from '~/lib/styles'
import { useStorefrontPage } from '../_hooks'
import type { StorefrontPrefetchProps } from '../_types'

function NotAvailable() {
  return (
    <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
      <p className="text-[16px] font-semibold">This page is not available</p>
      <p className="mt-1 text-[14px] text-sf-muted">
        It may have been moved or is no longer published.
      </p>
      <Link route="home" className={cn(storefront.primaryButton, 'mt-4')}>
        Back to shop
      </Link>
    </div>
  )
}

export default function PageShow({ slug }: StorefrontPrefetchProps & { slug: string }) {
  const { data: page, isLoading, isError, error, refetch } = useStorefrontPage(slug)
  const notFound = error instanceof HttpError && error.status === 404
  const body = page?.body ? sanitizeHtml(page.body) : ''

  return (
    <>
      <Head title={page?.seoTitle || page?.title || 'Page'} />
      <div className={cn(storefront.container, 'pb-4')}>
        <nav aria-label="Breadcrumb" className="mt-5 sm:mt-7">
          <ol className="flex min-w-0 items-center gap-1 text-[13px] text-sf-muted">
            <li>
              <Link route="home" className="hover:text-sf-text hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="flex-none">
              <ChevronRight size={14} />
            </li>
            <li className="min-w-0 truncate text-sf-text" aria-current="page">
              {page?.title ?? '…'}
            </li>
          </ol>
        </nav>

        {notFound ? (
          <NotAvailable />
        ) : isError ? (
          <div className={cn(storefront.card, 'mt-8 p-8 text-center')}>
            <p className="text-[15px] font-semibold">We couldn’t load this page</p>
            <button
              type="button"
              className={cn(storefront.primaryButton, 'mt-4')}
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <article className="mx-auto mt-4 mb-10 w-full max-w-3xl min-w-0 sm:mt-6">
            {isLoading || !page ? (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading page">
                <Skeleton className="h-9 w-64 max-w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] break-words sm:text-[32px]">
                  {page.title}
                </h1>
                {body && (
                  <div
                    className={cn(
                      storefront.richText,
                      'mt-5 overflow-x-auto text-[15px] break-words'
                    )}
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                )}
              </>
            )}
          </article>
        )}
      </div>
    </>
  )
}

PageShow.layout = [StorefrontLayout]
