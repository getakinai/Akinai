import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Loader2, PenLine } from 'lucide-react'
import { Skeleton, StarRating } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { cn, storefront } from '~/lib/styles'
import { useStorefrontSession } from '../_hooks'
import { useProductReviewSummary, useProductReviews } from './_hooks'
import ReviewForm from './_review_form'
import type { ProductReview, ProductReviewSummary } from './_types'

export const REVIEWS_SECTION_ID = 'reviews'

const reviewCountLabel = (count: number) => `${count} ${count === 1 ? 'review' : 'reviews'}`

/** Stars and review count under the product title; links to the reviews. */
export function RatingSummaryLink({ slug }: { slug: string }) {
  const { data } = useProductReviewSummary(slug)
  if (!data) return <Skeleton className="mt-2 h-4 w-32" />

  return (
    <a
      href={`#${REVIEWS_SECTION_ID}`}
      className="mt-2 inline-flex w-fit items-center gap-2 rounded-md text-[13px] text-sf-muted hover:text-sf-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      {data.average !== null && (
        <span className="text-sf-primary">
          <StarRating value={data.average} size="sm" />
        </span>
      )}
      <span className="underline-offset-2 hover:underline">
        {data.count === 0 ? 'No reviews yet' : reviewCountLabel(data.count)}
      </span>
    </a>
  )
}

function Distribution({ summary }: { summary: ProductReviewSummary }) {
  return (
    <ul className="mt-4 flex flex-col gap-1.5" aria-label="Ratings breakdown">
      {summary.distribution.map(({ rating, count }) => (
        <li key={rating} className="flex items-center gap-2 text-[12.5px] text-sf-muted">
          <span className="w-12 flex-none tabular-nums">{rating} star</span>
          <progress
            value={count}
            max={Math.max(summary.count, 1)}
            aria-label={`${rating} star: ${count}`}
            className="h-2 min-w-0 flex-1 appearance-none overflow-hidden rounded-full bg-sf-line [&::-moz-progress-bar]:bg-sf-primary [&::-webkit-progress-bar]:bg-sf-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sf-primary"
          />
          <span className="w-8 flex-none text-right tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  )
}

function WriteReview({ slug, summary }: { slug: string; summary: ProductReviewSummary }) {
  const { data: session } = useStorefrontSession()
  const [writing, setWriting] = useState(false)

  if (!session) return <Skeleton className="mt-5 h-10 w-full rounded-lg" />

  if (!session.signedIn) {
    return (
      <p className="mt-5 text-[13.5px] text-sf-muted">
        <Link
          route="customers.session.create"
          className="font-medium text-sf-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>{' '}
        to write a review.
      </p>
    )
  }

  if (summary.viewerHasReviewed) {
    return (
      <p className="mt-5 text-[13.5px] text-sf-muted">Thanks, you have reviewed this product.</p>
    )
  }

  if (writing) {
    return (
      <ReviewForm
        slug={slug}
        onCancel={() => setWriting(false)}
        onCreated={() => setWriting(false)}
      />
    )
  }

  return (
    <button
      type="button"
      className={cn(storefront.primaryButton, 'mt-5 w-full')}
      onClick={() => setWriting(true)}
    >
      <PenLine size={16} /> Write a review
    </button>
  )
}

function ReviewItem({ review }: { review: ProductReview }) {
  const { formatDate } = useDateFormat()
  const date = formatDate(review.createdAt)

  return (
    <li className="py-5 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-sf-primary">
          <StarRating value={review.rating} size="sm" />
          <span className="sr-only">{review.rating} out of 5 stars</span>
        </span>
        <time dateTime={review.createdAt} className="text-[12.5px] text-sf-muted">
          {date}
        </time>
      </div>
      {review.title && (
        <h3 className="mt-2 text-[14.5px] font-semibold break-words text-sf-text">
          {review.title}
        </h3>
      )}
      <p className="mt-1 text-[14px] leading-relaxed break-words whitespace-pre-line text-sf-text">
        {review.body}
      </p>
      <p className="mt-2 text-[12.5px] text-sf-muted">{review.author}</p>
    </li>
  )
}

function ReviewList({ slug }: { slug: string }) {
  const reviewsQuery = useProductReviews(slug)
  const reviews = reviewsQuery.data?.pages.flatMap((page) => page.data) ?? []

  if (reviewsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (reviewsQuery.isError) {
    return (
      <div className={cn(storefront.card, 'p-6 text-center')}>
        <p className="text-[14px]">We could not load reviews right now.</p>
        <button
          type="button"
          className={cn(storefront.primaryButton, 'mt-3')}
          onClick={() => reviewsQuery.refetch()}
        >
          Try again
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <p className={cn(storefront.card, 'p-6 text-center text-[14px] text-sf-muted')}>
        No reviews yet. Be the first to share your thoughts.
      </p>
    )
  }

  return (
    <>
      <ul className="divide-y divide-sf-line">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {reviewsQuery.hasNextPage && (
        <button
          type="button"
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sf-line bg-sf-surface px-4 text-[13.5px] font-medium text-sf-text transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60 sm:w-auto"
          onClick={() => reviewsQuery.fetchNextPage()}
          disabled={reviewsQuery.isFetchingNextPage}
        >
          {reviewsQuery.isFetchingNextPage ? (
            <>
              <Loader2 size={15} className="motion-safe:animate-spin" /> Loading
            </>
          ) : (
            'Show more reviews'
          )}
        </button>
      )}
    </>
  )
}

/**
 * Customer reviews: average and breakdown with the write-a-review action,
 * then the reviews. Stacked on small screens, side by side from `lg`.
 */
export default function Reviews({ slug }: { slug: string }) {
  const summaryQuery = useProductReviewSummary(slug)
  const summary = summaryQuery.data

  return (
    <section
      id={REVIEWS_SECTION_ID}
      aria-labelledby="reviews-title"
      className={cn(storefront.section, 'scroll-mt-24 border-t border-sf-line pt-8')}
    >
      <h2 id="reviews-title" className={storefront.sectionTitle}>
        Customer reviews
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          {summary ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-[36px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                  {summary.average?.toFixed(1) ?? '–'}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sf-primary">
                    <StarRating value={summary.average ?? 0} />
                  </span>
                  <span className="text-[12.5px] text-sf-muted">
                    {reviewCountLabel(summary.count)}
                  </span>
                </div>
              </div>
              <Distribution summary={summary} />
              <WriteReview slug={slug} summary={summary} />
            </>
          ) : summaryQuery.isError ? (
            <p className="text-[13.5px] text-sf-muted">Ratings are not available right now.</p>
          ) : (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <ReviewList slug={slug} />
        </div>
      </div>
    </section>
  )
}
