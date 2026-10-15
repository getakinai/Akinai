import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogHttp } from '~/lib/catalog_http'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  ProductReviewFormSchema,
  ProductReviewResponseSchema,
  ProductReviewSummaryResponseSchema,
  ProductReviewsResponseSchema,
  type ProductReviewForm,
} from './_types'

export const productReviewKeys = {
  all: (slug: string) => ['store', 'storefront', 'products', slug, 'reviews'] as const,
  summary: (slug: string) => [...productReviewKeys.all(slug), 'summary'] as const,
  list: (slug: string) => [...productReviewKeys.all(slug), 'list'] as const,
}

const reviewsUrl = (slug: string) => `/store/products/${encodeURIComponent(slug)}/reviews`

export async function fetchProductReviewSummary(slug: string) {
  const { data } = await catalogHttp(`${reviewsUrl(slug)}/summary`, {
    schema: ProductReviewSummaryResponseSchema,
  })
  return data
}

/** Average rating, per-star counts and whether the shopper has reviewed. */
export function useProductReviewSummary(slug: string) {
  return useQuery({
    queryKey: productReviewKeys.summary(slug),
    queryFn: () => fetchProductReviewSummary(slug),
    staleTime: 60 * 1000,
  })
}

export async function fetchProductReviews(slug: string, cursor?: string) {
  return catalogHttp(`${reviewsUrl(slug)}${toQueryString({ cursor })}`, {
    schema: ProductReviewsResponseSchema,
  })
}

/** Visible reviews, newest first, 10 at a time for "Show more". */
export function useProductReviews(slug: string) {
  return useInfiniteQuery({
    queryKey: productReviewKeys.list(slug),
    queryFn: ({ pageParam }) => fetchProductReviews(slug, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ metadata }) => metadata.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  })
}

export async function createProductReview(slug: string, payload: ProductReviewForm) {
  const { data } = await http(reviewsUrl(slug), {
    method: 'POST',
    body: ProductReviewFormSchema.parse(payload),
    schema: ProductReviewResponseSchema,
  })
  return data
}

export function useCreateProductReview(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductReviewForm) => createProductReview(slug, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productReviewKeys.all(slug) }),
  })
}
