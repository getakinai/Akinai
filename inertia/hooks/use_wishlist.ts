import { router } from '@inertiajs/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { urlFor } from '~/client'
import { HttpError } from '~/lib/http'
import { useStorefrontSession } from '~/pages/_hooks'
import { customerKeys } from '~/pages/customers/_hooks'
import {
  addToWishlist,
  removeFromWishlist,
  useWishlistIds,
  wishlistKeys,
} from '~/pages/customers/account/wishlist/_hooks'

type ToggleInput = { productId: string; save: boolean }

/**
 * Wishlist hearts for storefront product cards and the product page.
 * Guests are sent to the login page; signed-in customers toggle with an
 * optimistic update that rolls back on error.
 */
export function useWishlistToggle() {
  const queryClient = useQueryClient()
  const { data: session } = useStorefrontSession()
  const signedIn = session?.signedIn === true
  const { data: savedIds = [] } = useWishlistIds(signedIn)
  const saved = new Set(savedIds)

  const mutation = useMutation({
    mutationFn: ({ productId, save }: ToggleInput) =>
      save ? addToWishlist(productId) : removeFromWishlist(productId),
    onMutate: async ({ productId, save }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.ids })
      const previous = queryClient.getQueryData<string[]>(wishlistKeys.ids)
      queryClient.setQueryData<string[]>(wishlistKeys.ids, (current = []) =>
        save
          ? [productId, ...current.filter((id) => id !== productId)]
          : current.filter((id) => id !== productId)
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(wishlistKeys.ids, context?.previous)
      toast.error(
        error instanceof HttpError && error.status === 422
          ? error.message
          : 'We couldn’t update your wishlist. Please try again.'
      )
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: wishlistKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.activity }),
      ]),
  })

  const isSaved = (productId: string) => saved.has(productId)

  const toggle = (productId: string) => {
    if (!signedIn) {
      router.visit(urlFor('customers.session.create'))
      return
    }
    mutation.mutate({ productId, save: !saved.has(productId) })
  }

  return { isSaved, toggle }
}
