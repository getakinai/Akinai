import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { http } from '~/lib/http'
import {
  WishlistDeleteResponseSchema,
  WishlistIdsResponseSchema,
  WishlistListResponseSchema,
  WishlistStoreResponseSchema,
} from './_types'

export const wishlistKeys = {
  all: ['customer', 'wishlist'] as const,
  ids: ['customer', 'wishlist', 'ids'] as const,
  list: ['customer', 'wishlist', 'list'] as const,
}

export async function fetchWishlistIds() {
  const { data } = await http('/account/wishlist/ids', { schema: WishlistIdsResponseSchema })
  return data.productIds
}

/** Ids of the products the signed-in customer saved. Pass `enabled: false` for guests. */
export function useWishlistIds(enabled: boolean) {
  return useQuery({ queryKey: wishlistKeys.ids, queryFn: fetchWishlistIds, enabled })
}

export async function fetchWishlist(page: number) {
  return http(`/account/wishlist/list?page=${page}`, { schema: WishlistListResponseSchema })
}

/** Saved products as storefront cards, newest first, a page at a time. */
export function useWishlist() {
  return useInfiniteQuery({
    queryKey: wishlistKeys.list,
    queryFn: ({ pageParam }) => fetchWishlist(pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ metadata }) =>
      metadata.currentPage < metadata.lastPage ? metadata.currentPage + 1 : undefined,
  })
}

export async function addToWishlist(productId: string) {
  return http('/account/wishlist', {
    method: 'POST',
    body: { productId },
    schema: WishlistStoreResponseSchema,
  })
}

export async function removeFromWishlist(productId: string) {
  return http(`/account/wishlist/${productId}`, {
    method: 'DELETE',
    schema: WishlistDeleteResponseSchema,
  })
}
