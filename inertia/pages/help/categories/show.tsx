import { Head } from '@inertiajs/react'
import { Skeleton } from '~/components/ui'
import StorefrontLayout from '~/layouts/storefront'
import { HttpError } from '~/lib/http'
import { cn, storefront } from '~/lib/styles'
import {
  HelpArticleLink,
  HelpArticleListSkeleton,
  HelpBreadcrumb,
  HelpContactCard,
  HelpLoadError,
  HelpNotFound,
} from '../_components'
import { useHelpCategory } from '../_hooks'
import { HelpIcon } from '../_icons'

export default function HelpCategoryShow({ category: slug }: { category: string }) {
  const { data: category, isLoading, isError, error, refetch } = useHelpCategory(slug)
  const notFound = error instanceof HttpError && error.status === 404
  return (
    <>
      <Head title={category ? `${category.title} · Help` : 'Help'}>
        {category && <meta name="description" content={category.description} />}
      </Head>
      <div className={cn(storefront.container, 'pb-4')}>
        <HelpBreadcrumb current={category?.title ?? '…'} />

        {notFound ? (
          <HelpNotFound title="This help topic is not available" />
        ) : isError ? (
          <HelpLoadError message="We couldn’t load this help topic" onRetry={() => refetch()} />
        ) : (
          <div className="mx-auto mt-4 mb-10 w-full max-w-3xl min-w-0 sm:mt-6">
            {isLoading || !category ? (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading topic">
                <Skeleton className="h-9 w-64 max-w-full" />
                <Skeleton className="h-4 w-full" />
                <div className={cn(storefront.card, 'mt-4 p-2')}>
                  <HelpArticleListSkeleton />
                </div>
              </div>
            ) : (
              <>
                <header className="flex items-start gap-3">
                  <span className="mt-1 grid size-10 flex-none place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
                    <HelpIcon name={category.icon} />
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] break-words sm:text-[32px]">
                      {category.title}
                    </h1>
                    <p className="mt-1 text-[14.5px] text-sf-muted">{category.description}</p>
                  </div>
                </header>

                {category.sections.map((section) => (
                  <section
                    key={section.group?.slug ?? 'other'}
                    aria-label={section.group?.title ?? 'More articles'}
                    className="mt-8"
                  >
                    {section.group && (
                      <h2 className="text-[13px] font-semibold tracking-[0.06em] text-sf-muted uppercase">
                        {section.group.title}
                      </h2>
                    )}
                    <ul className={cn(storefront.card, 'mt-3 p-2')}>
                      {section.articles.map((article) => (
                        <li key={article.slug}>
                          <HelpArticleLink article={article} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </>
            )}

            <HelpContactCard className="mt-10" />
          </div>
        )}
      </div>
    </>
  )
}

HelpCategoryShow.layout = [StorefrontLayout]
