import { toast } from 'sonner'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { DataTableLoadMore } from '~/components/data_table'
import { FormButton } from '~/components/form'
import { Badge, Skeleton, StarRating } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { useAdminProductReviewsInfinite, useSetAdminProductReviewFlags } from './_hooks'
import type { AdminProductReview } from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

type ReviewsCardProps = {
  productId: string
  editable: boolean
}

/**
 * Customer reviews of the product, newest first. Reviews publish right
 * away; staff with edit access can hide or show them again.
 */
export default function ReviewsCard({ productId, editable }: ReviewsCardProps) {
  const list = useAdminProductReviewsInfinite(productId)
  const setFlags = useSetAdminProductReviewFlags()
  const total = list.data ? list.total : undefined

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggle(review: AdminProductReview) {
    const isHidden = !review.isHidden
    setFlags.mutate(
      { productId, id: review.id, isHidden },
      {
        onSuccess: () => toast.success(isHidden ? 'Review hidden' : 'Review shown'),
        onError,
      }
    )
  }

  function onToggleFeatured(review: AdminProductReview) {
    const isFeatured = !review.isFeatured
    setFlags.mutate(
      { productId, id: review.id, isFeatured },
      {
        onSuccess: () =>
          toast.success(
            isFeatured ? 'Review featured on the home page' : 'Review removed from the home page'
          ),
        onError,
      }
    )
  }

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          {total !== undefined && (
            <div className={card.eyebrow}>
              {total} {total === 1 ? 'review' : 'reviews'}
            </div>
          )}
          <h2 className={card.title}>Reviews</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            Reviews appear in the store as soon as customers post them. Hidden reviews are left out
            of the rating. Featured reviews show as testimonials on the home page.
          </p>
        </div>
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading reviews">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : list.isError && list.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load reviews.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => list.refetch()}>
            Try again
          </FormButton>
        </div>
      ) : list.rows.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-muted">No reviews yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {list.rows.map((review) => (
            <li key={review.id} className="flex min-w-0 flex-col gap-1.5 py-3 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-ink">
                    <StarRating value={review.rating} size="sm" />
                  </span>
                  <span className="sr-only">{review.rating} out of 5 stars</span>
                  {review.isHidden && <Badge tone="neutral">Hidden</Badge>}
                  {review.isFeatured && <Badge tone="success">Featured</Badge>}
                  <span className="font-mono text-[12px] text-muted">
                    {dateFormat.format(new Date(review.createdAt))}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-1 text-[13.5px] font-medium break-words text-ink">
                    {review.title}
                  </p>
                )}
                <p className="mt-0.5 text-[13.5px] break-words whitespace-pre-line text-ink-2">
                  {review.body}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-muted">
                  {review.customer
                    ? `${review.customer.fullName ?? 'Customer'} · ${review.customer.email}`
                    : 'Deleted customer'}
                </p>
              </div>
              {editable && (
                <div className="flex flex-none flex-wrap items-start gap-2">
                  {!review.isHidden && (
                    <FormButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={setFlags.isPending}
                      aria-pressed={review.isFeatured}
                      onClick={() => onToggleFeatured(review)}
                    >
                      <Sparkles size={15} /> {review.isFeatured ? 'Unfeature' : 'Feature'}
                    </FormButton>
                  )}
                  <FormButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={setFlags.isPending}
                    onClick={() => onToggle(review)}
                  >
                    {review.isHidden ? (
                      <>
                        <Eye size={15} /> Show
                      </>
                    ) : (
                      <>
                        <EyeOff size={15} /> Hide
                      </>
                    )}
                  </FormButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {list.rows.length > 0 && (
        <DataTableLoadMore
          loaded={list.rows.length}
          total={list.total}
          hasMore={list.hasNextPage}
          isLoadingMore={list.isFetchingNextPage}
          isError={list.isFetchNextPageError}
          onLoadMore={() => list.fetchNextPage()}
        />
      )}
    </section>
  )
}
