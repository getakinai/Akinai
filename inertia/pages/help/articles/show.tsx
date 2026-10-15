import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import StorefrontLayout from '~/layouts/storefront'
import { HttpError } from '~/lib/http'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { cn, storefront } from '~/lib/styles'
import {
  HelpArticleLink,
  HelpBreadcrumb,
  HelpContactCard,
  HelpLoadError,
  HelpNotFound,
} from '../_components'
import { useHelpArticle } from '../_hooks'
import type { HelpArticleSummary } from '../_types'

const articleBody = cn(
  storefront.richText,
  'mt-6 overflow-x-auto text-[15px] leading-relaxed',
  '[&_h2]:mt-8 [&_h2]:text-[18px] [&_h3]:mt-6 [&_h3]:text-[16px] [&_li]:mt-1 [&_p]:mt-3',
  '[&_table]:mt-3 [&_table]:w-full [&_table]:min-w-[480px] [&_table]:border-collapse [&_table]:text-[14px]',
  '[&_th]:border-b [&_th]:border-sf-line [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sf-text',
  '[&_td]:border-b [&_td]:border-sf-line [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top'
)

function PagerLink({
  article,
  direction,
}: {
  article: HelpArticleSummary
  direction: 'previous' | 'next'
}) {
  const isNext = direction === 'next'
  return (
    <Link
      route="storefront.help.articles.show"
      routeParams={{ category: article.categorySlug, slug: article.slug }}
      className={cn(
        storefront.card,
        'flex min-w-0 flex-1 flex-col gap-1 p-4 transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
        isNext && 'sm:items-end sm:text-right'
      )}
    >
      <span className="inline-flex items-center gap-1 text-[12.5px] text-sf-muted">
        {isNext ? (
          <>
            Next <ArrowRight size={13} aria-hidden="true" />
          </>
        ) : (
          <>
            <ArrowLeft size={13} aria-hidden="true" /> Previous
          </>
        )}
      </span>
      <span className="text-[14.5px] font-medium break-words text-sf-text">{article.title}</span>
    </Link>
  )
}

export default function HelpArticleShow({ category, slug }: { category: string; slug: string }) {
  const { data: article, isLoading, isError, error, refetch } = useHelpArticle(category, slug)
  const notFound = error instanceof HttpError && error.status === 404
  const body = article ? sanitizeHtml(article.body) : ''

  return (
    <>
      <Head title={article ? `${article.title} · Help` : 'Help'}>
        {article && <meta name="description" content={article.description} />}
      </Head>
      <div className={cn(storefront.container, 'pb-4')}>
        <HelpBreadcrumb category={article?.category} current={article?.title ?? '…'} />

        {notFound ? (
          <HelpNotFound title="This help article is not available" />
        ) : isError ? (
          <HelpLoadError message="We couldn’t load this article" onRetry={() => refetch()} />
        ) : (
          <div className="mx-auto mt-4 mb-10 w-full max-w-3xl min-w-0 sm:mt-6">
            {isLoading || !article ? (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading article">
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <article className="min-w-0">
                  <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] break-words sm:text-[32px]">
                    {article.title}
                  </h1>
                  <p className="mt-2 text-[15px] text-sf-muted">{article.description}</p>
                  {body && (
                    <div className={articleBody} dangerouslySetInnerHTML={{ __html: body }} />
                  )}
                  {article.cta && (
                    <Link
                      href={article.cta.href}
                      className={cn(storefront.primaryButton, 'mt-8 w-full sm:w-auto')}
                    >
                      {article.cta.label} <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </article>

                {article.related.length > 0 && (
                  <section aria-labelledby="help-related-title" className="mt-10">
                    <h2 id="help-related-title" className="text-[17px] font-semibold text-sf-text">
                      Related articles
                    </h2>
                    <ul className={cn(storefront.card, 'mt-3 p-2')}>
                      {article.related.map((related) => (
                        <li key={related.slug}>
                          <HelpArticleLink article={related} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(article.previous || article.next) && (
                  <nav
                    aria-label={`More in ${article.category.title}`}
                    className="mt-8 flex flex-col gap-3 sm:flex-row"
                  >
                    {article.previous && (
                      <PagerLink article={article.previous} direction="previous" />
                    )}
                    {article.next && <PagerLink article={article.next} direction="next" />}
                  </nav>
                )}
              </>
            )}

            <HelpContactCard className="mt-10" />
          </div>
        )}
      </div>
    </>
  )
}

HelpArticleShow.layout = [StorefrontLayout]
