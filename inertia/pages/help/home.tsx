import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import { SearchInput, Skeleton } from '~/components/ui'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import {
  HelpArticleLink,
  HelpArticleListSkeleton,
  HelpBreadcrumb,
  HelpContactCard,
  HelpLoadError,
} from './_components'
import { HELP_SEARCH_MIN_LENGTH, useHelpCenterHome, useHelpSearch } from './_hooks'
import { HelpIcon } from './_icons'
import type { HelpCategorySummary } from './_types'

function CategoryCard({ category }: { category: HelpCategorySummary }) {
  return (
    <li className={cn(storefront.card, 'flex min-w-0 flex-col p-5')}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
          <HelpIcon name={category.icon} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-sf-text">
            <Link
              route="storefront.help.categories.show"
              routeParams={{ category: category.slug }}
              className="hover:text-sf-primary hover:underline"
            >
              {category.title}
            </Link>
          </h2>
          <p className="mt-0.5 text-[13px] text-sf-muted">{category.description}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-2 text-[14px]">
        {category.articles.map((article) => (
          <li key={article.slug} className="min-w-0">
            <Link
              route="storefront.help.articles.show"
              routeParams={{ category: article.categorySlug, slug: article.slug }}
              className="break-words text-sf-text hover:text-sf-primary hover:underline"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        route="storefront.help.categories.show"
        routeParams={{ category: category.slug }}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-[13.5px] font-medium text-sf-primary hover:underline"
      >
        View all {category.articleCount} articles <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </li>
  )
}

function CategoryGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className={cn(storefront.card, 'flex flex-col gap-3 p-5')}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </li>
      ))}
    </ul>
  )
}

function SearchResults({ query }: { query: string }) {
  const { data, isFetching, isError, refetch } = useHelpSearch(query)

  return (
    <section
      aria-label="Search results"
      aria-busy={isFetching}
      className={cn(storefront.card, 'p-2')}
    >
      {isError ? (
        <div className="p-4 text-center text-[14px]">
          <p>We couldn’t search the help articles.</p>
          <button
            type="button"
            className="mt-2 font-medium text-sf-primary hover:underline"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      ) : !data ? (
        <HelpArticleListSkeleton rows={3} />
      ) : data.length === 0 ? (
        <p className="p-4 text-center text-[14px] text-sf-muted">
          No articles match “{query}”. Try another word, or contact us below.
        </p>
      ) : (
        <ul>
          {data.map((result) => (
            <li key={result.slug}>
              <HelpArticleLink article={result} meta={result.categoryTitle} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function HelpHome() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError, refetch } = useHelpCenterHome()
  const searching = query.trim().length >= HELP_SEARCH_MIN_LENGTH

  return (
    <>
      <Head title="Help and support">
        <meta
          name="description"
          content="Answers about ordering, delivery to the Philippines, payments, returns, and your account."
        />
      </Head>
      <div className={cn(storefront.container, 'pb-4')}>
        <HelpBreadcrumb />

        <header className="mx-auto mt-6 flex max-w-2xl flex-col items-center text-center sm:mt-10">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] sm:text-[34px]">
            How can we help?
          </h1>
          <p className="mt-2 text-[14.5px] text-sf-muted sm:text-[15.5px]">
            Answers about ordering, delivery to the Philippines, payments, returns, and your
            account.
          </p>
          <SearchInput
            label="Search help articles"
            placeholder="Search help, e.g. bank transfer"
            value={query}
            onDebouncedChange={setQuery}
            autoComplete="off"
            className="mt-6 w-full"
          />
        </header>

        {searching && (
          <div className="mx-auto mt-4 max-w-2xl">
            <SearchResults query={query.trim()} />
          </div>
        )}

        {isError ? (
          <HelpLoadError message="We couldn’t load the help center" onRetry={() => refetch()} />
        ) : (
          <>
            <section aria-label="Help topics" className={storefront.section}>
              {isLoading || !data ? (
                <CategoryGridSkeleton />
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.categories.map((category) => (
                    <CategoryCard key={category.slug} category={category} />
                  ))}
                </ul>
              )}
            </section>

            {(isLoading || (data && data.popular.length > 0)) && (
              <section aria-labelledby="help-popular-title" className={storefront.section}>
                <h2 id="help-popular-title" className={storefront.sectionTitle}>
                  Popular articles
                </h2>
                <div className={cn(storefront.card, 'mt-4 p-2')}>
                  {isLoading || !data ? (
                    <HelpArticleListSkeleton />
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2">
                      {data.popular.map((article) => (
                        <li key={article.slug} className="min-w-0">
                          <HelpArticleLink article={article} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <HelpContactCard className={cn(storefront.section, 'mb-10')} />
      </div>
    </>
  )
}

HelpHome.layout = [StorefrontLayout]
