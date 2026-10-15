import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { FormButton } from '~/components/form'
import { Skeleton, StarRating } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useSetAdminProductReviewFlags } from '../products/_hooks'
import type { AdminProductReview } from '../products/_types'
import { useAdminFeaturedReviews } from './_hooks'

/**
 * Reviews staff featured from a product page. They show as testimonials
 * on the home page; the section is hidden when none are featured.
 */
export default function FeaturedReviewsCard() {
  const { data: reviews, isLoading, isError, refetch } = useAdminFeaturedReviews()
  const canEditProducts = useCan('products.edit')
  const setFlags = useSetAdminProductReviewFlags()

  function unfeature(review: AdminProductReview) {
    if (!review.product) return
    setFlags.mutate(
      { productId: review.product.id, id: review.id, isFeatured: false },
      {
        onSuccess: () => toast.success('Review removed from the home page'),
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
      }
    )
  }

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          {reviews && (
            <div className={card.eyebrow}>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </div>
          )}
          <h2 className={card.title}>Testimonials</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            Feature a customer review from the Reviews card on its product page. The testimonials
            section is hidden on the storefront until a review is featured.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading reviews">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError || !reviews ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load the featured reviews.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-muted">No featured reviews yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {reviews.map((review) => (
            <li key={review.id} className="flex min-w-0 flex-col gap-1.5 py-3 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-ink">
                    <StarRating value={review.rating} size="sm" />
                  </span>
                  <span className="sr-only">{review.rating} out of 5 stars</span>
                  {review.product && (
                    <Link
                      route="admin.products.edit"
                      routeParams={{ id: review.product.id }}
                      className="truncate text-[12.5px] text-muted hover:text-ink"
                    >
                      {review.product.title}
                    </Link>
                  )}
                </div>
                {review.title && (
                  <p className="mt-1 text-[13.5px] font-medium break-words text-ink">
                    {review.title}
                  </p>
                )}
                <p className="mt-0.5 line-clamp-3 text-[13.5px] break-words text-ink-2">
                  {review.body}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-muted">
                  {review.customer?.fullName ?? 'Customer'}
                </p>
              </div>
              {canEditProducts && review.product && (
                <div className="flex-none">
                  <FormButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={setFlags.isPending}
                    onClick={() => unfeature(review)}
                  >
                    Unfeature
                  </FormButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
