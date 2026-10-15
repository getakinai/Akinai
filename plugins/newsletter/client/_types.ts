import { z } from 'zod'

export const NewsletterFormSchema = z.object({
  email: z.email('Enter a valid email address').trim().max(254),
})

export type NewsletterForm = z.infer<typeof NewsletterFormSchema>

export const NewsletterResponseSchema = z.object({
  data: z.object({ subscribed: z.boolean() }),
})
