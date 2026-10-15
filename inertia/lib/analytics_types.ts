import { z } from 'zod'

export const AnalyticsEventResponseSchema = z.object({
  data: z.object({ recorded: z.boolean() }),
})

export type AnalyticsEventType = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_started'
