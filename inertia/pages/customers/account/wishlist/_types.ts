import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { StorefrontProductCardSchema } from '../../../_types'

export const WishlistIdsResponseSchema = z.object({
  data: z.object({ productIds: z.array(z.string()) }),
})

export const WishlistStoreResponseSchema = z.object({
  data: z.object({ productId: z.string() }),
})

export const WishlistDeleteResponseSchema = z.null()

export const WishlistListResponseSchema = paginatedResponse(StorefrontProductCardSchema)
